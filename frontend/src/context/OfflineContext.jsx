// ============================================
// context/OfflineContext.jsx — Contexto de estado offline
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';
import { iniciarSyncManager, onSyncChange } from '../api/syncManager';
import { contarPendientes } from '../api/offlineDB';

const OfflineContext = createContext(null);

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(0);
  const [syncState, setSyncState] = useState('idle');
  const [syncInfo, setSyncInfo]   = useState({ total: 0, procesados: 0, errores: 0 });
  const [showSyncModal, setShowSyncModal] = useState(false);
  // Timestamp que cambia cada vez que la sync se completa → componentes pueden reaccionar
  const [syncCompletadoAt, setSyncCompletadoAt] = useState(null);

  useEffect(() => {
    iniciarSyncManager();

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onSyncChange(async (evento) => {
      setSyncState(evento.estado);
      setSyncInfo({
        total:     evento.total     || 0,
        procesados: evento.procesados || 0,
        errores:   evento.errores   || 0,
      });

      const count = await contarPendientes();
      setPendientes(count);

      // Mostrar modal cuando empieza a sincronizar
      if (evento.estado === 'sincronizando') {
        setShowSyncModal(true);
      }
      // Al completar: marcar timestamp para que componentes recarguen datos
      if (evento.estado === 'completado' || evento.estado === 'parcial') {
        setSyncCompletadoAt(Date.now());
        setTimeout(() => {
          setShowSyncModal(false);
          setSyncState('idle');
        }, 3500);
      }
    });

    contarPendientes().then(setPendientes);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, pendientes, syncState, syncCompletadoAt }}>
      {children}

      {/* ── Pastilla de estado offline (siempre visible sin conexión) ── */}
      {!isOnline && (
        <div style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          padding: '0.55rem 1.3rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
          zIndex: 9998,
          whiteSpace: 'nowrap',
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '0.01em',
        }}>
          📵
          {pendientes > 0
            ? `Sin conexión — ${pendientes} cambio${pendientes !== 1 ? 's' : ''} pendiente${pendientes !== 1 ? 's' : ''}`
            : 'Sin conexión — modo offline activo'}
        </div>
      )}

      {/* ── Modal de sincronización ── */}
      {showSyncModal && (
        <SyncModal
          syncState={syncState}
          syncInfo={syncInfo}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline debe usarse dentro de <OfflineProvider>');
  return ctx;
}

// ── Modal de sincronización ─────────────────────────────────────────────────
function SyncModal({ syncState, syncInfo, onClose }) {
  const isCompleted = syncState === 'completado';
  const isPartial   = syncState === 'parcial';
  const isSyncing   = syncState === 'sincronizando';

  const progress = syncInfo.total > 0
    ? Math.round((syncInfo.procesados / syncInfo.total) * 100)
    : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      animation: 'fadeIn 0.25s ease',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      <div style={{
        background: 'var(--bg-secondary, #fff)',
        border: '2px solid ' + (isCompleted ? '#10b981' : isPartial ? '#f59e0b' : '#2563eb'),
        borderRadius: '24px',
        padding: '2.25rem 2rem',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        animation: 'slideInUp 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Ícono animado */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px', margin: '0 auto 1.25rem',
          background: isCompleted
            ? 'linear-gradient(135deg,#10b981,#059669)'
            : isPartial
            ? 'linear-gradient(135deg,#f59e0b,#d97706)'
            : 'linear-gradient(135deg,#2563eb,#1e40af)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: isCompleted
            ? '0 8px 25px rgba(16,185,129,0.4)'
            : isPartial
            ? '0 8px 25px rgba(245,158,11,0.4)'
            : '0 8px 25px rgba(37,99,235,0.4)',
        }}>
          {isCompleted ? '✅' : isPartial ? '⚠️' : (
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span>
          )}
        </div>

        {/* Título */}
        <h3 style={{
          fontSize: '1.2rem', fontWeight: 800,
          color: 'var(--text-primary, #0f172a)',
          marginBottom: '0.5rem',
        }}>
          {isCompleted ? '¡Sincronización completa!' : isPartial ? 'Sincronización parcial' : 'Sincronizando datos...'}
        </h3>

        {/* Subtítulo */}
        <p style={{
          fontSize: '0.875rem', color: 'var(--text-secondary, #475569)',
          marginBottom: '1.5rem', lineHeight: 1.5,
        }}>
          {isCompleted
            ? `Se sincronizaron ${syncInfo.procesados} registro(s) exitosamente.`
            : isPartial
            ? `${syncInfo.procesados} sincronizado(s). ${syncInfo.errores} fallo(s) — se reintentará.`
            : `Enviando ${syncInfo.procesados} de ${syncInfo.total} registro(s) al servidor...`}
        </p>

        {/* Barra de progreso */}
        {(isSyncing || isCompleted) && (
          <div style={{
            background: 'var(--border-color, #e2e8f0)',
            borderRadius: '9999px', height: '8px',
            overflow: 'hidden', marginBottom: '1rem',
          }}>
            <div style={{
              height: '100%',
              width: isCompleted ? '100%' : `${progress}%`,
              background: isCompleted
                ? 'linear-gradient(90deg,#10b981,#059669)'
                : 'linear-gradient(90deg,#2563eb,#60a5fa)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        )}

        {/* Porcentaje */}
        {isSyncing && (
          <p style={{
            fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--text-muted, #94a3b8)',
            marginBottom: '1.25rem',
          }}>
            {progress}% completado
          </p>
        )}

        {/* Botón cerrar (solo al completar) */}
        {(isCompleted || isPartial) && (
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '0.75rem',
              background: isCompleted
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {isCompleted ? '¡Perfecto! Cerrar' : 'Entendido'}
          </button>
        )}

        {/* Animaciones inline */}
        <style>{`
          @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
          @keyframes slideInUp { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
          @keyframes spin      { to { transform:rotate(360deg) } }
        `}</style>
      </div>
    </div>
  );
}


