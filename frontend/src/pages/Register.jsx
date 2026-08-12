// ============================================
// pages/Register.jsx — Página de Registro
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
    rol: 'docente',
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);

    try {
      const resultado = await register(
        formData.nombre,
        formData.email,
        formData.password,
        formData.rol
      );

      if (resultado.exito) {
        navigate('/dashboard');
      } else {
        setError(resultado.mensaje);
      }
    } catch (err) {
      const mensajes = err.response?.data?.errores;
      if (mensajes && Array.isArray(mensajes)) {
        setError(mensajes.join('. '));
      } else {
        setError(
          err.response?.data?.mensaje || 'Error al conectar con el servidor'
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Panel izquierdo decorativo */}
        <div className="auth-banner">
          <div className="auth-banner-content">
            <div className="auth-banner-icon">📋</div>
            <h2 className="auth-banner-title">Cuaderno Pedagógico</h2>
            <p className="auth-banner-text">
              Crea tu cuenta para empezar a gestionar tu cuaderno pedagógico
              digital
            </p>
            <div className="auth-banner-badge">RM 01/2026</div>
            <div className="auth-banner-features">
              <div className="auth-feature">👨‍🏫 Rol Docente</div>
              <div className="auth-feature">👔 Rol Director</div>
              <div className="auth-feature">⚙️ Rol Administrador</div>
            </div>
          </div>
        </div>

        {/* Panel derecho: formulario */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            <h1 className="auth-title">Crear Cuenta</h1>
            <p className="auth-subtitle">
              Completa el formulario para registrarte
            </p>

            {error && (
              <div className="auth-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  👤 Nombre Completo
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Juan Pérez Mamani"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">
                  📧 Correo Electrónico
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="docente@colegio.edu.bo"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reg-password" className="form-label">
                    🔒 Contraseña
                  </label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmar" className="form-label">
                    🔒 Confirmar
                  </label>
                  <input
                    id="confirmar"
                    name="confirmarPassword"
                    type="password"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Repetir contraseña"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rol" className="form-label">
                  🎭 Rol
                </label>
                <select
                  id="rol"
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="docente">Docente</option>
                  <option value="director">Director</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="auth-submit-btn"
              >
                {cargando ? (
                  <>
                    <span className="btn-spinner"></span>
                    Registrando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>

            <p className="auth-switch">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="auth-switch-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
