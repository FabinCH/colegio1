// ============================================
// context/AuthContext.jsx — Estado Global de Autenticación
// ============================================
//
// OFFLINE FIX:
//   - Si hay token + usuario en localStorage → NO muestra pantalla de carga
//   - La verificación con el servidor ocurre en segundo plano
//   - Solo invalida la sesión con 401/403 explícito del servidor
//   - Error de red = mantener sesión local intacta

import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};

// ── Leer datos guardados de localStorage ────────────────────────────────────
function leerUsuarioLocal() {
  try {
    const s = localStorage.getItem('usuario');
    const usr = s ? JSON.parse(s) : null;
    if (!usr) return null;
    // Si el objeto guardado no tiene rol, intentar recuperarlo del JWT
    if (!usr.rol) {
      try {
        const tk = localStorage.getItem('token');
        if (tk) {
          const payload = JSON.parse(atob(tk.split('.')[1]));
          if (payload.rol) usr.rol = payload.rol;
        }
      } catch { /* ignorar */ }
    }
    return usr;
  } catch { return null; }
}

function leerTokenLocal() {
  return localStorage.getItem('token') || null;
}

export const AuthProvider = ({ children }) => {
  const tokenInicial   = leerTokenLocal();
  const usuarioInicial = leerUsuarioLocal();

  const [usuario, setUsuario] = useState(usuarioInicial);
  const [token, setToken]     = useState(tokenInicial);

  // Si ya tenemos token + usuario en cache → NO mostrar pantalla de carga
  // Solo mostramos carga si tenemos token pero NO datos de usuario (primera vez)
  const [cargando, setCargando] = useState(
    !!tokenInicial && !usuarioInicial
  );

  // ── Verificar sesión con el servidor (en segundo plano) ───────────────────
  useEffect(() => {
    const verificar = async () => {
      const tk = leerTokenLocal();
      if (!tk) {
        setCargando(false);
        return;
      }

      // Sin internet → intentar caché local o decodificar el JWT
      if (!navigator.onLine) {
        const usr = leerUsuarioLocal();
        if (usr) {
          setUsuario(usr);
          setToken(tk);
        } else {
          // No hay cache pero sí token → intentar decodificar JWT para datos básicos
          // (cubre el caso de usuarios que iniciaron sesión antes de que se guardara 'usuario')
          try {
            const payload = JSON.parse(atob(tk.split('.')[1]));
            // El JWT payload tiene: { id, rol } según authController.js
            // Usamos esos datos mínimos para mantener la sesión offline
            const usuarioFromJWT = {
              _id:    payload.id,   // el backend guarda como 'id' en el JWT
              id:     payload.id,
              nombre: 'Usuario',   // no está en el JWT, se completará al conectarse
              email:  '',
              rol:    payload.rol || 'docente',
            };
            setUsuario(usuarioFromJWT);
            setToken(tk);
            localStorage.setItem('usuario', JSON.stringify(usuarioFromJWT));
          } catch {
            // JWT indecodificable
          }
        }
        setCargando(false);
        return;
      }

      // Con internet → verificar con servidor
      try {
        const { data } = await API.get('/auth/perfil');
        // El backend devuelve { id, nombre, email, rol } (usa 'id' no '_id')
        const perfil = data.data.usuario;
        const usr = { ...perfil, _id: perfil.id || perfil._id };
        setUsuario(usr);
        setToken(tk);
        localStorage.setItem('usuario', JSON.stringify(usr));
      } catch (error) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          // Token inválido/expirado → limpiar todo
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setToken(null);
          setUsuario(null);
        } else {
          // Error de red u otro → mantener sesión local
          const usr = leerUsuarioLocal();
          if (usr) setUsuario(usr);
        }
      } finally {
        setCargando(false);
      }
    };

    // Solo verificar si NO teníamos datos cacheados (evita delay innecesario)
    if (cargando) {
      verificar();
    } else if (navigator.onLine && token) {
      // Verificación silenciosa en background (sin mostrar carga)
      verificar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-verificar al recuperar conexión
  useEffect(() => {
    const onOnline = async () => {
      const tk = leerTokenLocal();
      if (!tk) return;
      try {
        const { data } = await API.get('/auth/perfil');
        const perfil = data.data.usuario;
        const usr = { ...perfil, _id: perfil.id || perfil._id };
        setUsuario(usr);
        localStorage.setItem('usuario', JSON.stringify(usr));
      } catch { /* silencioso */ }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    if (!navigator.onLine) {
      return {
        exito: false,
        mensaje: 'Sin conexión. No se puede iniciar sesión por primera vez sin internet.',
      };
    }
    const { data } = await API.post('/auth/login', { email, password });
    if (data.exito) {
      const perfil = data.data.usuario;
      const usr    = { ...perfil, _id: perfil.id || perfil._id };
      const tk     = data.data.token;
      localStorage.setItem('token',   tk);
      localStorage.setItem('usuario', JSON.stringify(usr));
      setToken(tk);
      setUsuario(usr);
    }
    return data;
  };

  // ── Registro ───────────────────────────────────────────────────────────────
  const register = async (nombre, email, password, rol) => {
    const { data } = await API.post('/auth/register', { nombre, email, password, rol });
    if (data.exito) {
      const usr = data.data.usuario;
      const tk  = data.data.token;
      localStorage.setItem('token',   tk);
      localStorage.setItem('usuario', JSON.stringify(usr));
      setToken(tk);
      setUsuario(usr);
    }
    return data;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  const value = {
    usuario,
    token,
    cargando,
    login,
    register,
    logout,
    estaAutenticado: !!token && !!usuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
