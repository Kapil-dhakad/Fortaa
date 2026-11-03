import { useRef, useEffect } from 'react';
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
import iconCatMedical from '../assets/figma/icon_cat_medical.png';
import iconCatBeauty from '../assets/figma/icon_cat_beauty.png';
import iconCatLifestyle from '../assets/figma/icon_cat_lifestyle.png';
import iconCatHome from '../assets/figma/icon_cat_home.png';
import iconCatNutrition from '../assets/figma/icon_cat_nutrition.png';
import './BusinessOpportunity.css';

const productCategories = [
  { label: 'Health & Wellness', image: prodHealth, icon: iconCatMedical, active: false },
  { label: 'Beauty & Personal Care', image: prodBeauty, icon: iconCatBeauty, active: true },
  { label: 'Lifestyle', image: prodLifestyle, icon: iconCatLifestyle, active: false },
  { label: 'Home & Consumer', image: prodHome, icon: iconCatHome, active: false },
  { label: 'Nutrition', image: prodNutrition, icon: iconCatNutrition, active: false },
];

export default function BusinessOpportunity() {
  const productsScrollRef = useRef(null);

  useEffect(() => {
    if (productsScrollRef.current) {
      productsScrollRef.current.scrollLeft = 0;
    }
  }, []);

  const scrollProductsNext = () => {
    if (productsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productsScrollRef.current;
      const tileWidth = 106; // tile width + gap
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        productsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        productsScrollRef.current.scrollBy({ left: tileWidth, behavior: 'smooth' });
      }
    }
  };
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B128D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Business Leader</span>
              </div>

              <div className="figma-leader-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B128D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
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

          <div className="figma-products-outer-wrap">
            <div className="figma-products-inner-card" ref={productsScrollRef}>
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
                  <div className="figma-prod-label-box">
                    <div className="figma-prod-cat-circle">
                      <img src={item.icon} alt="" className="figma-prod-cat-icon" />
                    </div>
                    <span className="figma-prod-label">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pink Next Arrow (Frame 108 in Figma) */}
            <button
              type="button"
              className="figma-prod-next-arrow"
              aria-label="Next products"
              onClick={scrollProductsNext}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
