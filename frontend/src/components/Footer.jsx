

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      {/* Marca */}
      <div className="footer-left">
        <span className="footer-logo">🏫</span>
        <div className="footer-brand-text">
          <span className="footer-brand-name">Cuaderno Pedagógico Digital</span>
          <span className="footer-brand-copy">© {year} — Todos los derechos reservados</span>
        </div>
      </div>

      {/* Badge */}
      <div className="footer-center">
        <span className="footer-badge">RM 01/2026</span>
      </div>
    </footer>
  );
};

export default Footer;
