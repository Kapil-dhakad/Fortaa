import logoIcon from '../assets/figma/logo_icon_img.png';
import logoText from '../assets/figma/logo_text_img.png';
import socialInstagram from '../assets/figma/social_instagram.png';
import socialYoutube from '../assets/figma/social_youtube.png';
import socialLinkedin from '../assets/figma/social_linkedin.png';
import socialTelegram from '../assets/figma/social_telegram.png';
import './Footer.css';

const footerColumns = [
  {
    title: 'Explore',
    links: [
      { name: 'Companies', href: '#companies' },
      { name: 'Opportunities', href: '#opportunities' },
      { name: 'Products', href: '#products' },
      { name: 'Leaders', href: '#leaders' },
      { name: 'Promotions', href: '#promotions' },
      { name: 'News', href: '#news' },
      { name: 'Events', href: '#events' },
    ],
  },
  {
    title: 'Business',
    links: [
      { name: 'List Your Business', href: '#list-business' },
      { name: 'Advertise With Us', href: '#advertise' },
      { name: 'Featured Listings', href: '#featured' },
      { name: 'Partnership', href: '#partnership' },
      { name: 'Contact Sales', href: '#sales' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Articles', href: '#articles' },
      { name: 'Guides', href: '#guides' },
      { name: 'Success Stories', href: '#success' },
      { name: 'FAQs', href: '#faqs' },
      { name: 'Help Center', href: '#help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '#about' },
      { name: 'Contact', href: '#contact' },
      { name: 'Careers', href: '#careers' },
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms & Conditions', href: '#terms' },
      { name: 'Disclaimer', href: '#disclaimer' },
    ],
  },
];

const socialIcons = [
  { img: socialInstagram, label: 'Instagram', href: 'https://instagram.com' },
  { img: socialYoutube, label: 'YouTube', href: 'https://youtube.com' },
  { img: socialLinkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
  { img: socialTelegram, label: 'Telegram', href: 'https://telegram.org' },
];

export default function Footer() {
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

            {/* Social media icons */}
            <div className="figma-footer-socials-row">
              {socialIcons.map((s, idx) => (
                <a
                  key={idx}
                  href={s.href}
                  className="figma-footer-social-circle"
                  aria-label={s.label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={s.img} alt={s.label} className="figma-social-img" />
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
                      <a href={link.href} className="figma-footer-link-item">
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

