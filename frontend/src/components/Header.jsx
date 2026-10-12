

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificacionesPanel from './NotificacionesPanel';

const Header = ({ onToggleSidebar }) => {
  const { usuario } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [horaActual, setHoraActual] = useState(() =>
    new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const actualizar = () =>
      setHoraActual(
        new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
      );
    
    const ahora = new Date();
    const msHastaProximoMinuto = (60 - ahora.getSeconds()) * 1000 - ahora.getMilliseconds();

    const timeout = setTimeout(() => {
      actualizar();
      const intervalo = setInterval(actualizar, 60_000);
      return () => clearInterval(intervalo);
    }, msHastaProximoMinuto);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <header className="app-header">
      {}
      <div className="header-brand">
        <span className="header-brand-logo">📋</span>
        <div className="header-brand-text">
          <span className="header-brand-name">Cuaderno Pedagógico</span>
          <span className="header-brand-sub">RM 01 / 2026</span>
        </div>
      </div>

      {}
      <div className="header-center">
        <p className="header-greeting">
          Hola, <strong>{usuario?.nombre?.split(' ')[0] || 'Docente'}</strong> · {horaActual}
        </p>
      </div>

      {}
      <div className="header-actions">
        {}
        <span className="header-badge-role">
          <span className="header-badge-dot" />
          {usuario?.rol || 'docente'}
        </span>

        {}
        <NotificacionesPanel />

        {}
        <button
          id="btn-toggle-theme"
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a modo claro ☀️' : 'Cambiar a modo oscuro 🌙'}
          aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {}
        <button
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title="Abrir o cerrar menú"
          aria-controls="main-sidebar"
          aria-label="Alternar menú lateral"
        >
          ☰
        </button>
      </div>
    </header>
  );
};

export default Header;
