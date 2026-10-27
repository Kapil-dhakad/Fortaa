import { Link } from 'react-router-dom';
import heroMountainBg from '../assets/figma/hero_mountain_bg.png';
import heroRect7 from '../assets/figma/hero_rect_7.png';
import heroRect10 from '../assets/figma/hero_rect_10.png';
import heroRect11 from '../assets/figma/hero_rect_11.png';
import heroRect12 from '../assets/figma/hero_rect_12.png';
import heroPoly1 from '../assets/figma/hero_poly_1.png';
import heroRect8 from '../assets/figma/hero_rect_8.png';
import heroRect9 from '../assets/figma/hero_rect_9.png';
import heroTogetherTag from '../assets/figma/hero_together_tag.png';
import iconNetwork from '../assets/figma/icon_network.png';
import iconRightArrow from '../assets/figma/icon_right_arrow.png';
import iconSearchPurple from '../assets/figma/icon_search_purple.png';
import iconSearchWhite from '../assets/figma/icon_search_white.png';
import iconCompanies from '../assets/figma/icon_companies.png';
import iconLeaders from '../assets/figma/icon_leaders.png';
import iconProducts from '../assets/figma/icon_products.png';
import iconOpportunities from '../assets/figma/icon_opportunities.png';
import iconStatCompany from '../assets/figma/icon_stat_company.png';
import iconStatLeader from '../assets/figma/icon_stat_leader.png';
import iconStatOpp from '../assets/figma/icon_stat_opp.png';
import iconStatComm from '../assets/figma/icon_stat_comm.png';
import './HeroSection.css';

const quickCategories = [
  { icon: iconCompanies, label: 'Companies', href: '#companies' },
  { icon: iconLeaders, label: 'Leaders', href: '#leaders' },
  { icon: iconProducts, label: 'Products', href: '#products' },
  { icon: iconOpportunities, label: 'Opportunities', href: '#opportunities' },
];

const statsList = [
  { icon: iconStatCompany, count: '500+', label: 'Companies' },
  { icon: iconStatLeader, count: '10k+', label: 'Leaders' },
  { icon: iconStatOpp, count: '50k+', label: 'Opportunities' },
  { icon: iconStatComm, count: '1M+', label: 'Community' },
];

export default function HeroSection() {
  return (
    <section className="figma-hero-wrapper" id="home">
      <div className="figma-hero-canvas">
        {/* Right side mountain image [9:79] relX:701, relY:2, w:737, h:473 */}
        <img
          src={heroMountainBg}
          alt="Climbers helping each other on mountain peak"
          className="figma-hero-mountain"
        />

        {/* Left dark gradient vector [7:56] relX:0, relY:0, w:741, h:478 */}
        <img src={heroRect7} alt="" className="figma-hero-vec-7" />

        {/* Overlapping diagonal curved ribbons */}
        {/* [7:63] relX:434, relY:0, w:362, h:477 */}
        <img src={heroRect10} alt="" className="figma-hero-vec-10" />
        {/* [7:65] relX:653, relY:0, w:250, h:477 */}
        <img src={heroRect11} alt="" className="figma-hero-vec-11" />
        {/* [7:66] relX:614.2, relY:-44.4, w:235.1, h:276.9 — linear-gradient(335.62deg, #592B9E 26.69%, #5A2AB0 75.54%) */}
        <img src={heroRect12} alt="" className="figma-hero-vec-12" />

        {/* Bottom-left corner decorative shapes */}
        <img src={heroRect9} alt="" className="figma-hero-vec-9" />
        <img src={heroRect8} alt="" className="figma-hero-vec-8" />
        <img src={heroPoly1} alt="" className="figma-hero-poly-1" />

        {/* Handwritten script tagline on right side [10:174] */}
        <img
          src={heroTogetherTag}
          alt="Together We Build Bigger Dreams"
          className="figma-hero-together"
        />

        {/* Main Left Content */}
        <div className="figma-hero-left-content">
          {/* Badge [7:54] */}
          <div className="figma-hero-badge">
            <img src={iconNetwork} alt="" className="figma-badge-icon" />
            <span>DIRECT SELLING &amp; NETWORK MARKETING PLATFORM</span>
          </div>

          {/* Heading 1 [7:68] */}
          <h1 className="figma-hero-title">
            Discover Opportunities.
            <br />
            Build Connections.
          </h1>

          {/* Gradient Heading [9:81] */}
          <h2 className="figma-hero-subtitle-grad">Grow Your Business.</h2>

          {/* Description [9:82] */}
          <p className="figma-hero-desc">
            Explore direct-selling companies, business opportunities, products,
            industry leaders and the latest network marketing insights - all from
            one professional platform.
          </p>

          {/* Search Bar [9:84] w:575, h:40 */}
          <div className="figma-hero-search">
            <img
              src={iconSearchPurple}
              alt=""
              className="figma-hero-search-left-icon"
            />
            <input
              type="text"
              placeholder="Search companies, products, leaders or opportunities..."
            />
            <button type="button" className="figma-hero-search-submit" aria-label="Search">
              <img src={iconSearchWhite} alt="Search" />
            </button>
          </div>

          {/* CTA Buttons [9:100] & [9:108] */}
          <div className="figma-hero-cta-row">
            <a href="#opportunities" className="figma-hero-btn-explore">
              <span>Explore Opportunities</span>
              <img src={iconRightArrow} alt="" />
            </a>
            <Link to="/signup" className="figma-hero-btn-list">
              List Your Business
            </Link>
          </div>

          {/* Bottom 4 Quick Category Pills [Frame 6, 7, 8, 9] with #D51CFD icon boxes */}
          <div className="figma-hero-quick-cats">
            {quickCategories.map((item) => (
              <a key={item.label} href={item.href} className="figma-quick-cat-item">
                <div className="figma-quick-cat-icon-box">
                  <img src={item.icon} alt={item.label} />
                </div>
                <span className="figma-quick-cat-label">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right Bottom Stats Bar [9:169] relX:796, relY:366, w:628, h:73, bg:#0f123f */}
        <div className="figma-hero-stats-bar">
          {statsList.map((stat) => (
            <div key={stat.label} className="figma-stat-card">
              <div className="figma-stat-icon-box">
                <img src={stat.icon} alt={stat.label} />
              </div>
              <div className="figma-stat-text">
                <span className="figma-stat-count">{stat.count}</span>
                <span className="figma-stat-name">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
