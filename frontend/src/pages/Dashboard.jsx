// ============================================
// pages/Dashboard.jsx — Panel Principal
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotificaciones } from '../context/NotificacionesContext';
import API from '../api/axiosConfig';

const Dashboard = () => {
  const { usuario } = useAuth();
  const { pedirPermiso, permiso, suscrito, noLeidas, cargarNotificaciones } = useNotificaciones();

  const [stats, setStats] = useState({
    estudiantes: 0,
    materias: 0,
    cursos: 0,
    cuadernos: 0,
  });
  const [cargando, setCargando]           = useState(true);
  const [enviando, setEnviando]           = useState(false);
  const [mensajePrueba, setMensajePrueba] = useState('');

  const esDirectorOAdmin = usuario?.rol === 'director' || usuario?.rol === 'admin';

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const [estRes, matRes, curRes, cuadRes] = await Promise.all([
          API.get('/estudiantes'),
          API.get('/materias'),
          API.get('/cursos'),
          API.get('/cuadernos'),
        ]);
        setStats({
          estudiantes: estRes.data.cantidad || 0,
          materias:    matRes.data.cantidad || 0,
          cursos:      curRes.data.cantidad || 0,
          cuadernos:   cuadRes.data.cantidad || 0,
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarEstadisticas();
  }, []);

  const enviarPrueba = async () => {
    setEnviando(true);
    setMensajePrueba('');
    try {
      await API.post('/notificaciones/enviar-prueba');
      setMensajePrueba('ok');
      cargarNotificaciones();
    } catch (err) {
      setMensajePrueba('error:' + (err.response?.data?.mensaje || err.message));
    } finally {
      setEnviando(false);
      setTimeout(() => setMensajePrueba(''), 6000);
    }
  };

  const tarjetas = [
    { titulo: 'Estudiantes', valor: stats.estudiantes, icon: '👨‍🎓', color: 'card-blue' },
    { titulo: 'Materias',    valor: stats.materias,    icon: '📚',   color: 'card-purple' },
    { titulo: 'Cursos',      valor: stats.cursos,      icon: '🏫',   color: 'card-green' },
    { titulo: 'Cuadernos',   valor: stats.cuadernos,   icon: '📋',   color: 'card-orange' },
  ];

  return (
    <div className="page-container">
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Bienvenido, {usuario?.nombre || 'Docente'} 👋
          </h1>
          <p className="page-subtitle">
            Panel de control — Gestión {new Date().getFullYear()}
          </p>
        </div>
        <div className="header-badge">
          <span className="badge-dot"></span>
          {usuario?.rol || 'docente'}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.titulo} className={`stat-card ${tarjeta.color}`}>
            <div className="stat-card-header">
              <span className="stat-icon">{tarjeta.icon}</span>
              <span className="stat-title">{tarjeta.titulo}</span>
            </div>
            <div className="stat-value">
              {cargando ? <div className="stat-skeleton"></div> : tarjeta.valor}
            </div>
          </div>
        ))}
      </div>

      {/* ══ PANEL DE NOTIFICACIONES (solo director/admin) ══ */}
      {esDirectorOAdmin && (
        <div className="notif-test-panel">
          {/* Header */}
          <div className="notif-test-header">
            <span className="notif-test-icon">🔔</span>
            <div style={{ flex: 1 }}>
              <h2 className="notif-test-title">Centro de Notificaciones Push</h2>
              <p className="notif-test-sub">Prueba el sistema de alertas en tiempo real</p>
            </div>
            {noLeidas > 0 && (
              <div className="notif-test-badge-count">{noLeidas} sin leer</div>
            )}
          </div>

          {/* Chips de estado */}
          <div className="notif-test-status-row">
            <div className={`notif-test-status-chip ${permiso === 'granted' ? 'chip-ok' : permiso === 'denied' ? 'chip-error' : 'chip-warn'}`}>
              {permiso === 'granted'  ? '✅ Permiso concedido'
               : permiso === 'denied' ? '🚫 Permiso denegado'
               : '⏳ Sin permiso aún'}
            </div>
            <div className={`notif-test-status-chip ${suscrito ? 'chip-ok' : 'chip-warn'}`}>
              {suscrito ? '📡 Push activo' : '📴 Push inactivo'}
            </div>
          </div>

          {/* Área de activación */}
          {permiso !== 'granted' ? (
            <div className="notif-test-activate-area">
              <p className="notif-test-activate-text">
                Para recibir alertas en tu dispositivo (incluso con el navegador minimizado) necesitas activar el permiso:
              </p>
              <button className="notif-test-btn-activate" onClick={pedirPermiso}>
                🔔 Activar Notificaciones Push
              </button>
              {permiso === 'denied' && (
                <p className="notif-test-denied-msg">
                  ⚠️ Bloqueaste las notificaciones. Ve a la barra de URL → 🔒 →
                  Configuración del sitio → Notificaciones → <strong>Permitir</strong>, y recarga la página.
                </p>
              )}
            </div>
          ) : (
            /* Botones de prueba */
            <div className="notif-test-buttons">
              <p className="notif-test-buttons-label">
                Haz clic para enviar una notificación de prueba:
              </p>
              <div className="notif-test-btn-row">
                <button
                  className="notif-test-btn notif-test-btn-normal"
                  onClick={enviarPrueba}
                  disabled={enviando}
                >
                  {enviando ? '⏳ Enviando...' : '🔔 Enviar notificación de prueba'}
                </button>
              </div>
              {mensajePrueba === 'ok' && (
                <div className="notif-test-result result-ok">
                  ✅ Notificación enviada. Revisa la <strong>campana 🔔</strong> del header
                  y espera el <strong>pop-up del sistema operativo</strong> en la esquina de tu pantalla.
                </div>
              )}
              {mensajePrueba.startsWith('error:') && (
                <div className="notif-test-result result-error">
                  ❌ {mensajePrueba.replace('error:', '')}
                </div>
              )}
            </div>
          )}

          {/* Pasos */}
          <div className="notif-test-steps">
            <p className="notif-test-steps-title">📋 Pasos para recibir la notificación:</p>
            <ol className="notif-test-steps-list">
              <li className={permiso === 'granted' ? 'step-done' : ''}>
                {permiso === 'granted' ? '✅' : '1.'} Clic en <strong>"Activar Notificaciones Push"</strong> y acepta en el navegador
              </li>
              <li className={suscrito ? 'step-done' : ''}>
                {suscrito ? '✅' : '2.'} Espera a que diga <strong>"📡 Push activo"</strong>
              </li>
              <li>
                3. Clic en <strong>"Enviar notificación de prueba"</strong>
              </li>
              <li>
                4. Recibirás el pop-up del SO <strong>y</strong> la notificación aparecerá en la campana 🔔
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Acceso rápido */}
      <div className="quick-actions">
        <h2 className="section-title">⚡ Acceso Rápido</h2>
        <div className="actions-grid">
          <a href="/asistencia" className="action-card group">
            <span className="action-icon">✅</span>
            <span className="action-text">Registrar Asistencia</span>
          </a>
          <a href="/evaluaciones" className="action-card group">
            <span className="action-icon">📝</span>
            <span className="action-text">Registrar Notas</span>
          </a>
          <a href="/estudiantes" className="action-card group">
            <span className="action-icon">👨‍🎓</span>
            <span className="action-text">Ver Estudiantes</span>
          </a>
          <a href="/cuadernos" className="action-card group">
            <span className="action-icon">📋</span>
            <span className="action-text">Mis Cuadernos</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
