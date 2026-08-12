// ============================================
// components/Footer.jsx — Pie de página con redes sociales
// ============================================

const socialLinks = [
  { icon: '📘', label: 'Facebook', href: 'https://facebook.com', color: '#1877f2' },
  { icon: '📸', label: 'Instagram', href: 'https://instagram.com', color: '#e1306c' },
  { icon: '🐦', label: 'Twitter/X', href: 'https://twitter.com', color: '#1da1f2' },
  { icon: '▶️', label: 'YouTube', href: 'https://youtube.com', color: '#ff0000' },
  { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com', color: '#0a66c2' },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      {/* Izquierda: marca */}
      <div className="footer-left">
        <span className="footer-logo">🏫</span>
        <div className="footer-brand-text">
          <span className="footer-brand-name">Cuaderno Pedagógico Digital</span>
          <span className="footer-brand-copy">© {year} — Todos los derechos reservados</span>
        </div>
      </div>

      {/* Centro: badge normativa */}
      <div className="footer-center">
        <span className="footer-badge">RM 01/2026</span>
      </div>

      {/* Derecha: redes sociales */}
      <div className="footer-right">
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn"
            title={social.label}
            aria-label={`Visitar ${social.label}`}
          >
            {social.icon}
          </a>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
