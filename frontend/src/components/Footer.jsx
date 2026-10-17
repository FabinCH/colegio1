

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
        <a
          href="https://www.minedu.gob.bo/files/documentos-normativos/resoluciones-ministeriales/1_RM_0001_EDUCACIN_REGULAR.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-badge"
          title="Ver Resolución Ministerial 01/2026 — MINEDU Bolivia"
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >RM 01/2026</a>
      </div>
    </footer>
  );
};

export default Footer;
