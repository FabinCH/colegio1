// ============================================
// components/NotificacionesPanel.jsx
// ============================================
//
// Campana en el header con:
//   - Badge de conteo de no leídas
//   - Panel deslizante con lista de notificaciones
//   - Botón para pedir permiso de notificaciones push
//   - Acciones: marcar leída, marcar todas, eliminar

import { useEffect, useRef } from 'react';
import { useNotificaciones } from '../context/NotificacionesContext';

// Íconos por tipo de notificación
const ICONOS_TIPO = {
  alerta_asistencia: '📅',
  alerta_prediccion: '🤖',
  alerta_evaluacion: '📊',
  nuevo_cuaderno:    '📋',
  sistema:           '⚙️',
  info:              'ℹ️',
};

// Colores por prioridad
const CLASE_PRIORIDAD = {
  critica: 'notif-prioridad-critica',
  alta:    'notif-prioridad-alta',
  media:   'notif-prioridad-media',
  baja:    'notif-prioridad-baja',
};

function tiempoRelativo(fecha) {
  const ahora = new Date();
  const diff  = ahora - new Date(fecha);
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(diff / 3600000);
  const dias  = Math.floor(diff / 86400000);

  if (mins < 1)  return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${dias} día${dias > 1 ? 's' : ''}`;
}

const NotificacionesPanel = () => {
  const {
    notificaciones,
    noLeidas,
    cargando,
    permiso,
    suscrito,
    panelAbierto,
    esDirectorOAdmin,
    pedirPermiso,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    abrirPanel,
    cerrarPanel,
  } = useNotificaciones();

  const panelRef = useRef(null);

  // Cerrar el panel al hacer clic fuera
  useEffect(() => {
    const manejarClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        cerrarPanel();
      }
    };
    if (panelAbierto) {
      document.addEventListener('mousedown', manejarClick);
    }
    return () => document.removeEventListener('mousedown', manejarClick);
  }, [panelAbierto, cerrarPanel]);

  // No mostrar nada si no es director ni admin
  if (!esDirectorOAdmin) return null;

  const handleCampana = () => {
    if (panelAbierto) {
      cerrarPanel();
    } else {
      abrirPanel();
    }
  };

  return (
    <div className="notif-wrapper" ref={panelRef}>
      {/* ── Botón campana ── */}
      <button
        id="btn-notificaciones"
        className={`notif-bell-btn ${panelAbierto ? 'activo' : ''}`}
        onClick={handleCampana}
        title="Notificaciones"
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} nuevas)` : ''}`}
      >
        <span className={`notif-bell-icon ${noLeidas > 0 ? 'notif-bell-ring' : ''}`}>
          🔔
        </span>
        {noLeidas > 0 && (
          <span className="notif-badge">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {panelAbierto && (
        <div className="notif-panel">
          {/* Header del panel */}
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              <span>🔔 Notificaciones</span>
              {noLeidas > 0 && (
                <span className="notif-panel-count">{noLeidas} nuevas</span>
              )}
            </div>
            <div className="notif-panel-actions">
              {noLeidas > 0 && (
                <button
                  className="notif-btn-leer-todas"
                  onClick={marcarTodasLeidas}
                  title="Marcar todas como leídas"
                >
                  ✓ Todas leídas
                </button>
              )}
              <button
                className="notif-btn-cerrar"
                onClick={cerrarPanel}
                aria-label="Cerrar panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Banner de permiso push */}
          {permiso !== 'granted' && (
            <div className="notif-permiso-banner">
              <div className="notif-permiso-info">
                <span className="notif-permiso-icon">📱</span>
                <div>
                  <strong>Activar notificaciones push</strong>
                  <p>Recibe alertas aunque el navegador esté cerrado</p>
                </div>
              </div>
              <button
                className="notif-btn-activar"
                onClick={pedirPermiso}
              >
                Activar
              </button>
            </div>
          )}

          {/* Indicador de suscripción activa */}
          {permiso === 'granted' && suscrito && (
            <div className="notif-push-activo">
              <span>✅ Notificaciones push activas</span>
            </div>
          )}

          {/* Lista de notificaciones */}
          <div className="notif-lista">
            {cargando ? (
              <div className="notif-cargando">
                <div className="notif-spinner" />
                <span>Cargando...</span>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="notif-vacio">
                <span className="notif-vacio-icon">📭</span>
                <p>Sin notificaciones</p>
                <small>Las alertas del sistema aparecerán aquí</small>
              </div>
            ) : (
              notificaciones.map((notif) => (
                <div
                  key={notif._id}
                  className={`notif-item ${!notif.leida ? 'notif-no-leida' : ''} ${CLASE_PRIORIDAD[notif.prioridad] || ''}`}
                  onClick={() => !notif.leida && marcarLeida(notif._id)}
                >
                  {/* Indicador de no leída */}
                  {!notif.leida && <span className="notif-dot" />}

                  {/* Ícono tipo */}
                  <span className="notif-tipo-icon">
                    {ICONOS_TIPO[notif.tipo] || '🔔'}
                  </span>

                  {/* Contenido */}
                  <div className="notif-contenido">
                    <p className="notif-titulo">{notif.titulo}</p>
                    <p className="notif-mensaje">{notif.mensaje}</p>
                    <div className="notif-meta">
                      {notif.remitente && (
                        <span className="notif-remitente">
                          {notif.remitente.nombre}
                        </span>
                      )}
                      <span className="notif-tiempo">
                        {tiempoRelativo(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Botón eliminar */}
                  <button
                    className="notif-btn-eliminar"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarNotificacion(notif._id);
                    }}
                    title="Eliminar notificación"
                    aria-label="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacionesPanel;
