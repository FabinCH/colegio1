// ============================================
// context/NotificacionesContext.jsx
// ============================================
//
// Maneja todo el ciclo de vida de las notificaciones push:
//   1. Pedir permiso al usuario
//   2. Registrar el Service Worker
//   3. Suscribirse al servidor push (VAPID)
//   4. Guardar la suscripción en el backend
//   5. Polling del conteo de notificaciones no leídas
//   6. Listar / marcar como leídas las notificaciones

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import API from '../api/axiosConfig';

const NotificacionesContext = createContext();

export const useNotificaciones = () => {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  return ctx;
};

// ── Helpers ──────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const NotificacionesProvider = ({ children }) => {
  const { usuario, estaAutenticado } = useAuth();

  const [notificaciones, setNotificaciones]   = useState([]);
  const [noLeidas, setNoLeidas]               = useState(0);
  const [cargando, setCargando]               = useState(false);
  const [permiso, setPermiso]                 = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [suscrito, setSuscrito]               = useState(false);
  const [swRegistrado, setSwRegistrado]       = useState(null);
  const [panelAbierto, setPanelAbierto]       = useState(false);

  const pollingRef = useRef(null);

  // ── Solo para director y admin ───────────────────────────
  const esDirectorOAdmin = usuario?.rol === 'director' || usuario?.rol === 'admin';

  // ── Registrar Service Worker ─────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !estaAutenticado) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[Push] Service Worker registrado:', registration.scope);
        setSwRegistrado(registration);

        // Escuchar mensajes del SW (navegar, etc.)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'NAVIGATE') {
            window.location.href = event.data.url;
          }
          if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
            // Re-suscribir automáticamente
            suscribirAlPush(registration);
          }
        });
      })
      .catch((err) => console.error('[Push] Error registrando SW:', err));
  }, [estaAutenticado]);

  // ── Suscribir al push ─────────────────────────────────────
  const suscribirAlPush = useCallback(async (registration) => {
    try {
      const { data: vapidData } = await API.get('/notificaciones/vapid-key');
      const publicKey = vapidData.data.publicKey;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Guardar en el backend
      await API.post('/notificaciones/suscribir', { subscription: subscription.toJSON() });
      setSuscrito(true);
      console.log('[Push] Suscrito al push notifications');
      return subscription;
    } catch (err) {
      console.error('[Push] Error al suscribir:', err);
      setSuscrito(false);
      return null;
    }
  }, []);

  // ── Pedir permiso ─────────────────────────────────────────
  const pedirPermiso = useCallback(async () => {
    if (!esDirectorOAdmin) return false;
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones push');
      return false;
    }

    let resultado = Notification.permission;

    if (resultado === 'default') {
      resultado = await Notification.requestPermission();
    }

    setPermiso(resultado);

    if (resultado === 'granted' && swRegistrado) {
      const sub = await suscribirAlPush(swRegistrado);
      return !!sub;
    }

    return resultado === 'granted';
  }, [esDirectorOAdmin, swRegistrado, suscribirAlPush]);

  // ── Auto-suscribir si ya tenía permiso ───────────────────
  useEffect(() => {
    if (!swRegistrado || !esDirectorOAdmin) return;
    if (Notification.permission !== 'granted') return;

    swRegistrado.pushManager.getSubscription().then((existing) => {
      if (existing) {
        setSuscrito(true);
      } else {
        suscribirAlPush(swRegistrado);
      }
    });
  }, [swRegistrado, esDirectorOAdmin, suscribirAlPush]);

  // ── Cargar notificaciones ─────────────────────────────────
  const cargarNotificaciones = useCallback(async () => {
    if (!estaAutenticado) return;
    try {
      setCargando(true);
      const { data } = await API.get('/notificaciones?limite=30');
      if (data.exito) {
        setNotificaciones(data.data.notificaciones);
        setNoLeidas(data.data.noLeidas);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err.message);
    } finally {
      setCargando(false);
    }
  }, [estaAutenticado]);

  // ── Polling del conteo cada 30s ──────────────────────────
  useEffect(() => {
    if (!estaAutenticado || !esDirectorOAdmin) return;

    const actualizarConteo = async () => {
      try {
        const { data } = await API.get('/notificaciones/conteo');
        if (data.exito) setNoLeidas(data.data.noLeidas);
      } catch { /* silencioso */ }
    };

    actualizarConteo();
    pollingRef.current = setInterval(actualizarConteo, 30_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [estaAutenticado, esDirectorOAdmin]);

  // ── Marcar una como leída ─────────────────────────────────
  const marcarLeida = useCallback(async (id) => {
    try {
      await API.patch(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leida: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marcando notificación:', err.message);
    }
  }, []);

  // ── Marcar todas como leídas ─────────────────────────────
  const marcarTodasLeidas = useCallback(async () => {
    try {
      await API.patch('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch (err) {
      console.error('Error marcando todas:', err.message);
    }
  }, []);

  // ── Eliminar notificación ─────────────────────────────────
  const eliminarNotificacion = useCallback(async (id) => {
    try {
      await API.delete(`/notificaciones/${id}`);
      setNotificaciones((prev) => {
        const notif = prev.find((n) => n._id === id);
        if (notif && !notif.leida) setNoLeidas((c) => Math.max(0, c - 1));
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error('Error eliminando notificación:', err.message);
    }
  }, []);

  // ── Toggle panel ──────────────────────────────────────────
  const abrirPanel = useCallback(() => {
    setPanelAbierto(true);
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const cerrarPanel = useCallback(() => {
    setPanelAbierto(false);
  }, []);

  const value = {
    notificaciones,
    noLeidas,
    cargando,
    permiso,
    suscrito,
    panelAbierto,
    esDirectorOAdmin,
    pedirPermiso,
    cargarNotificaciones,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    abrirPanel,
    cerrarPanel,
  };

  return (
    <NotificacionesContext.Provider value={value}>
      {children}
    </NotificacionesContext.Provider>
  );
};

export default NotificacionesContext;
