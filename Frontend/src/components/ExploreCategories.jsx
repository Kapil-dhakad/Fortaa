import iconNetwork from '../assets/figma/icon_network.png';
import iconCompanies from '../assets/figma/icon_companies.png';
import iconLeaders from '../assets/figma/icon_leaders.png';
import iconProducts from '../assets/figma/icon_products.png';
import './ExploreCategories.css';

const categories = [
  {
    id: 'companies',
    title: 'Companies',
    subtitle: 'Discover Direct Selling Companies',
    description:
      'Explore company profiles, business information, products and industry presence.',
    cta: 'Explore Companies',
    cardClass: 'cat-card-companies',
    iconClass: 'cat-icon-companies',
    icon: iconCompanies,
    lightTheme: false,
    ctaColor: '#EBDEFF',
  },
  {
    id: 'opportunities',
    title: 'Opportunities',
    subtitle: 'Find New Opportunities',
    description:
      'Discover business and distribution opportunities shared by participating organiations.',
    cta: 'Explore Companies',
    cardClass: 'cat-card-opportunities',
    iconClass: 'cat-icon-opportunities',
    icon: iconCompanies,
    lightTheme: false,
    ctaColor: '#EBDEFF',
  },
  {
    id: 'leaders',
    title: 'Leaders',
    subtitle: 'Meet Industry Professionals',
    description:
      'Discover leaders, entrepreneurs and professionals shaping the direct-selling industry.',
    cta: 'View Leaders',
    cardClass: 'cat-card-leaders',
    iconClass: 'cat-icon-leaders',
    icon: iconLeaders,
    lightTheme: false,
    ctaColor: '#EBDEFF',
  },
  {
    id: 'products',
    title: 'Products',
    subtitle: 'Explore Featured Products',
    description:
      'Discover products and brands across multiple categories.',
    cta: 'Browse Products',
    cardClass: 'cat-card-products',
    iconClass: 'cat-icon-products',
    icon: iconProducts,
    lightTheme: true,
    ctaColor: '#B42855',
  },
  {
    id: 'promotions',
    title: 'Promotions',
    subtitle: 'Promote Your Business',
    description:
      'Increase your brand visibility with featured listings and promotional campaigns.',
    cta: 'Browse Products',
    cardClass: 'cat-card-promotions',
    iconClass: 'cat-icon-promotions',
    icon: iconProducts,
    lightTheme: true,
    ctaColor: '#F0815F',
  },
  {
    id: 'news',
    title: 'Industry News',
    subtitle: 'Stay Ahead of the Industry',
    description:
      'Get the latest news, trends,launches and business insights.',
    cta: 'Browse Products',
    cardClass: 'cat-card-news',
    iconClass: 'cat-icon-news',
    icon: iconProducts,
    lightTheme: true,
    ctaColor: '#3B52C4',
  },
];

export default function ExploreCategories() {
  return (
    <section className="figma-explore-section" id="explore">
      <div className="figma-explore-container">
        {/* Top Header Row */}
        <div className="figma-explore-header">
          <div className="figma-explore-header-left">
            <div className="figma-explore-tag">
              <img src={iconNetwork} alt="" className="figma-explore-tag-icon" />
              <span>EXPLORE FORTAA</span>
            </div>
            <h2 className="figma-explore-heading">
              Everything You Need to Explore &amp; Grow
            </h2>
          </div>

          <a href="#categories" className="figma-explore-view-all">
            <span>View All Categories</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B52C4" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* 6 Category Cards Grid (each 223 × 280px) */}
        <div className="figma-categories-row">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`figma-cat-card ${cat.cardClass} ${
                cat.lightTheme ? 'light-card' : 'dark-card'
              }`}
            >
              {/* Decorative corner & glow shapes matching Figma */}
              <div className="figma-cat-corner- wedge" />
              <div className="figma-cat-glow-1" />
              <div className="figma-cat-glow-2" />

              {/* Top Icon + Title */}
              <div className="figma-cat-top">
                <div className={`figma-cat-icon-box ${cat.iconClass}`}>
                  <img src={cat.icon} alt={cat.title} />
                </div>
                <h3 className="figma-cat-title">{cat.title}</h3>
              </div>

              {/* Body Copy */}
              <div className="figma-cat-body">
                <h4 className="figma-cat-subtitle">{cat.subtitle}</h4>
                <p className="figma-cat-desc">{cat.description}</p>
              </div>

              {/* Bottom CTA Link */}
              <a
                href={`#${cat.id}`}
                className="figma-cat-cta"
                style={{ color: cat.ctaColor }}
              >
                <span>{cat.cta}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={cat.ctaColor}
                  strokeWidth="2.2"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
