import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoIconImg from '../assets/figma/logo_icon_img.png';
import logoTextImg from '../assets/figma/logo_text_img.png';
import iconSearchPurple from '../assets/figma/icon_search_purple.png';
import './Navbar.css';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Companies', href: '/#companies' },
  { label: 'Opportunities', href: '/#opportunities' },
  { label: 'Products', href: '/#products' },
  { label: 'Leaders', href: '/#leaders' },
  { label: 'Promotions', href: '/#promotions' },
  { label: 'News', href: '/#news' },
  { label: 'Events', href: '/#events' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="figma-navbar">
      <div className="figma-navbar-inner">
        {/* Logo [128:530] x:29, y:0, w:234, h:42 */}
        <Link to="/" className="figma-logo">
          <img src={logoIconImg} alt="Fortaa F" className="figma-logo-icon" />
          <div className="figma-logo-text-wrap">
            <img src={logoTextImg} alt="FORTAA" className="figma-logo-word" />
            <span className="figma-logo-tagline">Discover, easy and Grow</span>
          </div>
        </Link>

        {/* Navbar Feature [2:43] x:271, y:10, w:604, h:12, gap:20 */}
        <nav className={`figma-nav-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link, idx) => {
            const isActive = idx === 0 && (location.pathname === '/' && !location.hash);
            return (
              <a
                key={link.label}
                href={link.href}
                className={`figma-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Component button [62:27] x:1086, y:6, w:308, h:30 */}
        <div className="figma-nav-actions">
          <button
            type="button"
            className="figma-search-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <img src={iconSearchPurple} alt="Search" />
          </button>

          <Link to="/login" className="figma-btn-login">
            Log In
          </Link>

          <Link to="/signup" className="figma-btn-list-business">
            List Your Business
          </Link>

          <button
            type="button"
            className="figma-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="figma-nav-search-dropdown">
          <input
            type="text"
            placeholder="Search companies, products, leaders or opportunities..."
            autoFocus
          />
        </div>
      )}
    </header>
  );
}
