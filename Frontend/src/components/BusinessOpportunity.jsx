import iconNetwork from '../assets/figma/icon_network.png';
import iconRightArrow from '../assets/figma/icon_right_arrow.png';
import handshakeBusiness from '../assets/figma/handshake_business.jpg';
import alexMorgan from '../assets/figma/alex_morgan.png';
import megaphoneGrowth3d from '../assets/figma/megaphone_growth_3d.png';
import prodHealth from '../assets/figma/prod_health.png';
import prodBeauty from '../assets/figma/prod_beauty.png';
import prodLifestyle from '../assets/figma/prod_lifestyle.png';
import prodHome from '../assets/figma/prod_home.png';
import prodNutrition from '../assets/figma/prod_nutrition.png';
import './BusinessOpportunity.css';

const productCategories = [
  { label: 'Health & Wellness', image: prodHealth, active: false },
  { label: 'Beauty & Personal Care', image: prodBeauty, active: true },
  { label: 'Lifestyle', image: prodLifestyle, active: false },
  { label: 'Home & Consumer', image: prodHome, active: false },
  { label: 'Nutrition', image: prodNutrition, active: false },
];

export default function BusinessOpportunity() {
  return (
    <section className="figma-mid-sections-wrap">
      {/* ================= ROW 1: Opportunities (Left) & Leaders (Right) ================= */}
      <div className="figma-two-col-container">
        {/* LEFT BOX: Find Your Next Business Opportunity [665 x 350] */}
        <div className="figma-biz-box figma-box-opp" id="opportunities">
          <div className="figma-box-header">
            <div className="figma-box-tag">
              <img src={iconNetwork} alt="" className="figma-box-tag-icon" />
              <span>EXPLORE FORTAA</span>
            </div>
            <h2 className="figma-box-title">Find Your Next Business Opportunity</h2>
            <p className="figma-box-subtitle">
              Browse opportunities from businesses looking to connect with distributors,
              partners and enterpreneurs.
            </p>
          </div>

          <div className="figma-opp-inner-card">
            <div className="figma-opp-img-wrap">
              <img src={handshakeBusiness} alt="Business Opportunity" />
              <span className="figma-hot-badge">Hot Opportunities</span>
            </div>

            <div className="figma-opp-info-wrap">
              <div className="figma-opp-tags-line">
                <span className="figma-opp-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Online
                </span>
                <span className="figma-opp-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Direct selling
                </span>
              </div>

              <h3 className="figma-opp-heading">Independent Business Opportunity</h3>
              <div className="figma-opp-find-title">What you'll find:</div>

              <div className="figma-opp-checklist">
                <div className="figma-opp-check-item">
                  <span className="figma-check-mark">✓</span>
                  <span>Business information</span>
                </div>
                <div className="figma-opp-check-item">
                  <span className="figma-check-mark">✓</span>
                  <span>Opportunity details</span>
                </div>
                <div className="figma-opp-check-item">
                  <span className="figma-check-mark">✓</span>
                  <span>Product category</span>
                </div>
                <div className="figma-opp-check-item">
                  <span className="figma-check-mark">✓</span>
                  <span>Contact information</span>
                </div>
              </div>

              <div className="figma-opp-action-row">
                <a href="#view-opportunity" className="figma-btn-purple">
                  <span>View Opportunity</span>
                  <img src={iconRightArrow} alt="" />
                </a>
                <a href="#all-opportunities" className="figma-link-arrow">
                  <span>Explore All Opportunity</span>
                  <img src={iconRightArrow} alt="" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOX: Industry Leaders [713 x 320] */}
        <div className="figma-biz-box figma-box-leaders" id="leaders">
          <div className="figma-box-header">
            <div className="figma-box-tag">
              <img src={iconNetwork} alt="" className="figma-box-tag-icon" />
              <span>INDUSTRY LEADERS</span>
            </div>
            <h2 className="figma-box-title">People Behind the Network</h2>
            <p className="figma-box-subtitle">
              Meet professionals, entrepreneurs and leaders building businesses across the
              direct-selling ecosystem.
            </p>
          </div>

          <div className="figma-leader-inner-card">
            <div className="figma-leader-avatar-wrap">
              <img src={alexMorgan} alt="Alex Morgan" />
            </div>

            <div className="figma-leader-info-wrap">
              <h3 className="figma-leader-name">Alex Morgan</h3>

              <div className="figma-leader-meta">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B128D" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>Business Leader</span>
              </div>

              <div className="figma-leader-meta">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B128D" strokeWidth="2">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                <span>10+ Years Industry Experience</span>
              </div>

              <div className="figma-leader-actions-row">
                <a href="#view-leader" className="figma-btn-purple">
                  <span>View Profile</span>
                  <img src={iconRightArrow} alt="" />
                </a>

                <div className="figma-carousel-arrows">
                  <button type="button" aria-label="Previous">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#750192" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button type="button" aria-label="Next">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#750192" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="figma-dots-and-link">
                <div className="figma-carousel-dots">
                  <span className="dot active" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <a href="#all-leaders" className="figma-link-arrow">
                  <span>Explore All Opportunity</span>
                  <img src={iconRightArrow} alt="" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ROW 2: Featured Products (Left) & Put Business Spotlight (Right) ================= */}
      <div className="figma-two-col-container">
        {/* LEFT BOX: Featured Products [664 x 216] */}
        <div className="figma-biz-box figma-box-products" id="products">
          <div className="figma-box-header">
            <div className="figma-box-tag">
              <img src={iconNetwork} alt="" className="figma-box-tag-icon" />
              <span>FEATURED PRODUCTS</span>
            </div>
            <h2 className="figma-box-title figma-title-pink">Discover Featured Products</h2>
            <p className="figma-box-subtitle">
              Popular products and brands from companies listed on our platform.
            </p>
          </div>

          <div className="figma-products-inner-card">
            {productCategories.map((item) => (
              <div
                key={item.label}
                className={`figma-prod-tile ${item.active ? 'active-tile' : ''}`}
              >
                {item.active && (
                  <span className="figma-prod-hot-pill">Hot Opportunities</span>
                )}
                <div className="figma-prod-img-box">
                  <img src={item.image} alt={item.label} className="figma-prod-img" />
                </div>
                <span className="figma-prod-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT BOX: Put Your Business in the Spotlight [713 x 216] */}
        <div className="figma-biz-box figma-box-spotlight" id="spotlight">
          <div className="figma-spotlight-left-content">
            <h2 className="figma-spotlight-title">
              Put your Business
              <br />
              in the spotlight
            </h2>
            <p className="figma-spotlight-desc">
              Reach a relevant audience and increase visibility for your company,
              products and business opportunities.
            </p>

            {/* 3 mini benefit cards */}
            <div className="figma-spotlight-cards-row">
              <div className="figma-spotlight-mini-card">
                <span className="figma-spotlight-card-heading">Featured Placement</span>
                <span className="figma-spotlight-card-sub">Get trustworthy across our sections</span>
              </div>
              <div className="figma-spotlight-mini-card">
                <span className="figma-spotlight-card-heading">Brand Visibility</span>
                <span className="figma-spotlight-card-sub">Showcase your brand, products and services.</span>
              </div>
              <div className="figma-spotlight-mini-card">
                <span className="figma-spotlight-card-heading">Targeted Promotion</span>
                <span className="figma-spotlight-card-sub">Connect with a reviews audience.</span>
              </div>
            </div>

            <div className="figma-spotlight-actions-row">
              <a href="#advertise" className="figma-btn-magenta">
                <span>Advertise With Fortaa</span>
                <img src={iconRightArrow} alt="" />
              </a>
              <a href="#ad-plans" className="figma-spotlight-underline-link">
                View Advertising Plans
              </a>
            </div>
          </div>

          <div className="figma-spotlight-illustration-wrap">
            <img src={megaphoneGrowth3d} alt="Megaphone & Growth 3D" />
          </div>
        </div>
      </div>
    </section>
  );
}
