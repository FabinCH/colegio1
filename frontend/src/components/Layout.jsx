// ============================================
// components/Layout.jsx — Shell principal de la app
// ============================================

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Colapsar automáticamente en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false); // en móvil usamos slide, no collapse
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="app-shell">
      {/* Header fijo en la parte superior */}
      <Header onToggleSidebar={handleToggleSidebar} />

      {/* Cuerpo: sidebar + contenido */}
      <div className="app-body">
        {/* Overlay para móvil */}
        {mobileOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 40,
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar collapsed={collapsed} />

        {/* Área de contenido + footer */}
        <div className="main-content">
          <div className="main-scroll-area">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
