// ============================================
// components/ProtectedRoute.jsx — Protección de Rutas
// ============================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();

  // Mostrar spinner solo si estamos verificando activamente con el servidor
  // (ocurre solo cuando hay token pero no datos locales de usuario)
  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #ffffff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
          Verificando sesión...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
