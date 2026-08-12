// ============================================
// components/Sidebar.jsx — Menú lateral mejorado
// ============================================

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Secciones SIN filtro por roles (el filtro se aplica en el render)
const menuSections = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',    label: 'Dashboard',    icon: '📊' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { path: '/estudiantes',  label: 'Estudiantes',  icon: '👨‍🎓' },
      { path: '/materias',     label: 'Materias',     icon: '📚' },
      { path: '/cursos',       label: 'Cursos',       icon: '🏫' },
      { path: '/cuadernos',    label: 'Cuadernos',    icon: '📋' },
    ],
  },
  {
    label: 'Pedagógico',
    items: [
      { path: '/asistencia',   label: 'Asistencia',   icon: '✅' },
      { path: '/evaluaciones', label: 'Evaluaciones', icon: '📝' },
      { path: '/reportes',     label: 'Reportes',     icon: '📈' },
    ],
  },
  {
    label: 'Inteligencia',
    soloRoles: ['admin', 'director'],  // oculto para docentes
    items: [
      { path: '/predicciones', label: 'Predicciones ML', icon: '🤖' },
    ],
  },
];

const Sidebar = ({ collapsed }) => {
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
  const seccionesVisibles = menuSections.filter((section) => {
    if (!section.soloRoles) return true;          // sin restricción → siempre visible
    return section.soloRoles.includes(rolActual); // con restricción → verificar rol
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Navegación por secciones */}
      <nav className="sidebar-nav">
        {seccionesVisibles.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : ''}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-text">{item.label}</span>
                {/* Tooltip visible solo cuando está colapsado */}
                <span className="sidebar-link-tooltip">{item.icon} {item.label}</span>
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
