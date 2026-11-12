import { useNavigate } from 'react-router-dom';
import {
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
  FaTelegramPlane,
  FaFacebookF,
} from 'react-icons/fa';
import logoIcon from '../assets/figma/logo_icon_img.png';
import logoText from '../assets/figma/logo_text_img.png';
import './Footer.css';

const footerColumns = [
  {
    title: 'Explore',
    links: [
      { name: 'Companies', href: '#companies', targetId: 'companies' },
      { name: 'Opportunities', href: '#opportunities', targetId: 'opportunities' },
      { name: 'Services', href: '#services', targetId: 'services' },
      { name: 'Leaders', href: '#leaders', targetId: 'leaders' },
      { name: 'Promotions', href: '#promotions', targetId: 'promotions' },
      { name: 'News', href: '#news', targetId: 'news' },
      { name: 'Events', href: '#events', targetId: 'events' },
    ],
  },
  {
    title: 'Business',
    links: [
      { name: 'List Your Business', href: '/signup', isRoute: true },
      { name: 'Advertise With Us', href: '#promotions', targetId: 'promotions' },
      { name: 'Featured Listings', href: '#companies', targetId: 'companies' },
      { name: 'Partnership', href: '/login', isRoute: true },
      { name: 'Contact Sales', href: '/login', isRoute: true },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Articles', href: '#news', targetId: 'news' },
      { name: 'Guides', href: '/login', isRoute: true },
      { name: 'Success Stories', href: '#growth', targetId: 'growth' },
      { name: 'FAQs', href: '/login', isRoute: true },
      { name: 'Help Center', href: '/login', isRoute: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/login', isRoute: true },
      { name: 'Contact', href: '/login', isRoute: true },
      { name: 'Careers', href: '/login', isRoute: true },
      { name: 'Privacy Policy', href: '/login', isRoute: true },
      { name: 'Terms & Conditions', href: '/login', isRoute: true },
      { name: 'Disclaimer', href: '/login', isRoute: true },
    ],
  },
];

const socialIcons = [
  { icon: <FaInstagram size={15} />, label: 'Instagram', href: 'https://instagram.com' },
  { icon: <FaYoutube size={15} />, label: 'YouTube', href: 'https://youtube.com' },
  { icon: <FaLinkedinIn size={14} />, label: 'LinkedIn', href: 'https://linkedin.com' },
  { icon: <FaTelegramPlane size={14} />, label: 'Telegram', href: 'https://telegram.org' },
  { icon: <FaFacebookF size={14} />, label: 'Facebook', href: 'https://facebook.com' },
];

export default function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (e, link) => {
    e.preventDefault();
    if (link.isRoute) {
      navigate(link.href);
      return;
    }
    if (link.targetId) {
      const elem = document.getElementById(link.targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${link.targetId}`);
        return;
      }
    }
    navigate('/login');
  };

  return (
    <footer className="figma-footer" id="footer">
      <div className="figma-footer-wrapper">
        <div className="figma-footer-main-row">
          {/* Brand info */}
          <div className="figma-footer-brand-col">
            <div className="figma-footer-logo-row">
              <img src={logoIcon} alt="FORTAA Logo" className="figma-footer-logo-icon" />
              <img src={logoText} alt="FORTAA" className="figma-footer-logo-text" />
            </div>
            <p className="figma-footer-tagline">Discover, Connect, Grow.</p>
            <p className="figma-footer-description">
              A professional discovery and promotional platform for the direct selling and network marketing ecosystem.
            </p>

            {/* Crisp modern vector social media icons */}
            <div className="figma-footer-socials-row">
              {socialIcons.map((s, idx) => (
                <a
                  key={idx}
                  href={s.href}
                  className="figma-footer-social-circle"
                  aria-label={s.label}
                  target="_blank"
                  rel="noreferrer"
                  title={s.label}
                >
                  <span className="figma-social-vector-icon">{s.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation link columns */}
          <div className="figma-footer-nav-grid">
            {footerColumns.map((col, idx) => (
              <div key={idx} className="figma-footer-col">
                <h4 className="figma-footer-col-title">{col.title}</h4>
                <ul className="figma-footer-links-list">
                  {col.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <a
                        href={link.href}
                        onClick={(e) => handleLinkClick(e, link)}
                        className="figma-footer-link-item"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="figma-footer-bottom-row">
          <span className="figma-footer-copy">@ 2026 Fortaa. All rights reserved.</span>
          <span className="figma-footer-motto">
            Your Gateway to the Direct Selling &amp; Fortaa Marketing Industry
          </span>
        </div>
      </div>
    </footer>
  );
}
