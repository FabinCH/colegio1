// ============================================
// pages/Login.jsx — Página de Inicio de Sesión
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const resultado = await login(email, password);
      if (resultado.exito) {
        navigate('/dashboard');
      } else {
        setError(resultado.mensaje);
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── Panel izquierdo decorativo ── */}
        <div className="auth-banner">
          <div className="auth-banner-content">
            <div className="auth-banner-icon-wrap">📋</div>
            <h2 className="auth-banner-title">Cuaderno Pedagógico</h2>
            <p className="auth-banner-subtitle">Sistema de Gestión Educativa Digital</p>
            <div className="auth-banner-badge">✦ RM 01/2026 ✦</div>

            <div className="auth-features">
              {[
                { icon: '✅', text: 'Registro de Asistencia Diaria' },
                { icon: '📝', text: 'Evaluaciones por Dimensiones' },
                { icon: '📊', text: 'Centralizador de Notas' },
                { icon: '👨‍🎓', text: 'Gestión de Estudiantes' },
                { icon: '📴', text: 'Disponible sin Internet (PWA)' },
              ].map((feat) => (
                <div key={feat.text} className="auth-feature">
                  <div className="auth-feature-icon">{feat.icon}</div>
                  {feat.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Panel derecho: formulario ── */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            <h1 className="auth-title">Iniciar Sesión</h1>
            <p className="auth-subtitle">Ingresa tus credenciales para acceder al sistema</p>

            {error && (
              <div className="auth-error">
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Correo */}
              <div className="form-group">
                <label htmlFor="email" className="form-label form-label-required">
                  📧 Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="docente@colegio.edu.bo"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Contraseña */}
              <div className="form-group">
                <label htmlFor="password" className="form-label form-label-required">
                  🔒 Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ paddingRight: '3rem' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: '0.9rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      color: 'var(--text-muted)',
                      padding: '0.25rem',
                      lineHeight: 1,
                    }}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Botón submit */}
              <button
                type="submit"
                disabled={cargando}
                className="auth-submit-btn"
                id="login-submit-btn"
              >
                {cargando ? (
                  <>
                    <span className="btn-spinner" />
                    Verificando...
                  </>
                ) : (
                  <>🚀 Ingresar al Sistema</>
                )}
              </button>
            </form>

            <div className="auth-divider">o</div>

            <p className="auth-switch">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="auth-switch-link">
                Regístrate aquí →
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
