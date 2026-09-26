// ============================================
// components/Sidebar.jsx — Menú lateral mejorado
// ============================================

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Secciones SIN filtro por roles (el filtro se aplica en el render)
const menuSections = [
  { label: 'Inicio', items: [
    { path: '/dashboard', label: 'Resumen general', icon: '📊' },
  ] },
  { label: 'Gestión académica', items: [
    { path: '/cursos', label: 'Cursos', icon: '🏫' },
    { path: '/materias', label: 'Materias', icon: '📚' },
    { path: '/estudiantes', label: 'Estudiantes', icon: '👨‍🎓' },
  ] },
  { label: 'Trabajo docente', items: [
    { path: '/cuadernos', label: 'Cuadernos', icon: '📋' },
    { path: '/asistencia', label: 'Asistencia', icon: '✅' },
    { path: '/evaluaciones', label: 'Evaluaciones', icon: '📝' },
  ] },
  { label: 'Seguimiento', items: [
    { path: '/reportes', label: 'Reportes', icon: '📈' },
    { path: '/predicciones', label: 'Predicciones', icon: '🤖', soloRoles: ['admin', 'director'] },
  ] },
  { label: 'Administración', items: [
    { path: '/director', label: 'Dirección', icon: '🏫', soloRoles: ['admin', 'director'] },
    { path: '/admin', label: 'Administración', icon: '🛡️', soloRoles: ['admin'] },
  ] },
];

const Sidebar = ({ collapsed, mobileOpen, onNavigate }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U';

  // Rol real del usuario — primero del objeto usuario, luego del JWT como fallback
  const rolDesdeToken = (() => {
    try {
      const tk = localStorage.getItem('token');
      if (!tk) return '';
      const payload = JSON.parse(atob(tk.split('.')[1]));
      return String(payload.rol || '').toLowerCase().trim();
    } catch { return ''; }
  })();
  const rolActual = String(usuario?.rol || rolDesdeToken || '').toLowerCase().trim();

  // Filtrar secciones según el rol
  const seccionesVisibles = menuSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.soloRoles || item.soloRoles.includes(rolActual)),
  })).filter((section) => section.items.length > 0);

  return (
    <aside id="main-sidebar" className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Navegación por secciones */}
      <nav className="sidebar-nav" aria-label="Navegación principal">
        {seccionesVisibles.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                aria-label={item.label}
                title={collapsed ? item.label : ''}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-text">{item.label}</span>
                {/* Tooltip visible solo cuando está colapsado */}
                <span className="sidebar-link-tooltip" aria-hidden="true">{item.icon} {item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Usuario y logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user" title={collapsed ? usuario?.nombre : ''}>
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{usuario?.nombre || 'Usuario'}</span>
            <span className="sidebar-user-role">{usuario?.rol || 'docente'}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="sidebar-logout"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          🚪
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
