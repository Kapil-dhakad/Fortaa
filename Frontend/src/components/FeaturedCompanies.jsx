import iconNetwork from '../assets/figma/icon_network.png';
import iconRightArrow from '../assets/figma/icon_right_arrow.png';
import companyForever from '../assets/figma/company_forever.png';
import companyAmway from '../assets/figma/company_amway.png';
import companyOriflame from '../assets/figma/company_oriflame.png';
import companyHerbalife from '../assets/figma/company_herbalife.png';
import './FeaturedCompanies.css';

const companies = [
  {
    id: 'forever',
    nameLine1: 'Forever Living',
    nameLine2: 'Health & Wellness',
    logo: companyForever,
    logoClass: 'logo-forever',
    badgeClass: 'badge-solid',
    rating: '4.6 (2.5k+ reviews)',
    shapeType: 'ellipse',
  },
  {
    id: 'amway',
    nameLine1: 'Amway',
    nameLine2: 'Lifestyle',
    logo: companyAmway,
    logoClass: 'logo-amway',
    badgeClass: 'badge-grad',
    rating: '4.6 (1.5k+ reviews)',
    shapeType: 'polygon',
  },
  {
    id: 'oriflame',
    nameLine1: 'Oriflame',
    nameLine2: 'Personal Care',
    logo: companyOriflame,
    logoClass: 'logo-oriflame',
    badgeClass: 'badge-grad',
    rating: '4.5 (1.5k+ reviews)',
    shapeType: 'polygon',
  },
  {
    id: 'herbalife',
    nameLine1: 'Herbalife',
    nameLine2: 'Nutrition',
    logo: companyHerbalife,
    logoClass: 'logo-herbalife',
    badgeClass: 'badge-grad',
    rating: '4.7 (1.5k+ reviews)',
    shapeType: 'polygon',
  },
];

export default function FeaturedCompanies() {
  return (
    <section className="figma-featured-companies-sec" id="companies">
      {/* Frame 48: width 1381px, height 311px, left 53px */}
      <div className="figma-fc-frame48">
        {/* Header Row */}
        <div className="figma-fc-header">
          <div className="figma-fc-header-left">
            <div className="figma-fc-tag">
              <img src={iconNetwork} alt="" className="figma-fc-tag-icon" />
              <span>EXPLORE FORTAA</span>
            </div>
            <h2 className="figma-fc-title">Discover Featured Companies</h2>
            <p className="figma-fc-subtitle">
              Explore business gaining visibility across the Fortaa community.
            </p>
          </div>

          <a href="#all-companies" className="figma-fc-view-all">
            <span>View All Categories</span>
            <svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="#750292" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* 4 Cards Row — each 334 × 192px, border 1px solid #E8E9FE, radius 10px */}
        <div className="figma-fc-cards-row">
          {companies.map((c) => (
            <div key={c.id} className="figma-fc-card">
              {/* Left side: Logo + Decorative Soft Shape */}
              <div className="figma-fc-card-left">
                <div className={`figma-fc-logo-wrap ${c.logoClass}`}>
                  <img src={c.logo} alt={`${c.nameLine1} ${c.nameLine2}`} />
                </div>

                {c.shapeType === 'ellipse' ? (
                  <div className="figma-fc-ellipse-shape" />
                ) : (
                  <div className="figma-fc-polygon-shape">
                    <svg width="86" height="82" viewBox="0 0 113 111" fill="none">
                      <path
                        d="M50.2 6.8C54.5 -0.2 64.7 -0.2 69.0 6.8L108.8 71.8C113.3 79.1 108.0 88.5 99.4 88.5H19.8C11.2 88.5 5.9 79.1 10.4 71.8L50.2 6.8Z"
                        fill="#EFEEFD"
                        transform="rotate(165 56.5 55.5)"
                      />
                      <circle cx="45" cy="48" r="3.5" fill="#D5D4F7" />
                      <circle cx="68" cy="48" r="3.5" fill="#D5D4F7" />
                      <circle cx="56" cy="67" r="3.5" fill="#D5D4F7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Right side: Featured Pill + Name + Rating + View Company Button */}
              <div className="figma-fc-card-right">
                <span className={`figma-fc-badge ${c.badgeClass}`}>Featured</span>

                <h3 className="figma-fc-company-name">
                  {c.nameLine1}
                  <br />
                  {c.nameLine2}
                </h3>

                <div className="figma-fc-rating-row">
                  <span className="figma-fc-star">★</span>
                  <span className="figma-fc-rating-text">{c.rating}</span>
                </div>

                <a href={`#company-${c.id}`} className="figma-fc-btn-view">
                  <span>View Company</span>
                  <img src={iconRightArrow} alt="" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
