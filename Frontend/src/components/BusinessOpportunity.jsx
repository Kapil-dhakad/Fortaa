import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import iconNetwork from '../assets/figma/icon_network.png';
import iconRightArrow from '../assets/figma/icon_right_arrow.png';
import handshakeBusiness from '../assets/figma/handshake_business.jpg';
import alexMorgan from '../assets/figma/alex_morgan.png';
import priyaSharma from '../assets/figma/priya_sharma.png';
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

const leadersData = [
  {
    name: 'Alex Morgan',
    role: 'Business Leader',
    exp: '10+ Years Industry Experience',
    avatar: alexMorgan,
  },
  {
    name: 'Neha Gupta',
    role: 'Senior Network Director',
    exp: '8+ Years Industry Experience',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Vikram Yadav',
    role: 'Global Expansion Ambassador',
    exp: '12+ Years Industry Experience',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Priya Sharma',
    role: 'Direct Sales Strategist & Mentor',
    exp: '7+ Years Industry Experience',
    avatar: priyaSharma,
  },
];

const serviceCategories = [
  { label: 'Health & Wellness Consulting', image: prodHealth, icon: iconCatMedical, active: false },
  { label: 'Beauty & Personal Care', image: prodBeauty, icon: iconCatBeauty, active: true },
  { label: 'Lifestyle & Travel Advisory', image: prodLifestyle, icon: iconCatLifestyle, active: false },
  { label: 'Home & Consumer Services', image: prodHome, icon: iconCatHome, active: false },
  { label: 'Nutrition & Diet Consulting', image: prodNutrition, icon: iconCatNutrition, active: false },
];

export default function BusinessOpportunity() {
  const navigate = useNavigate();
  const productsScrollRef = useRef(null);
  const [activeLeaderIdx, setActiveLeaderIdx] = useState(0);

  useEffect(() => {
    if (productsScrollRef.current) {
      productsScrollRef.current.scrollLeft = 0;
    }
  }, []);

  const handlePrevLeader = () => {
    setActiveLeaderIdx((prev) => (prev === 0 ? leadersData.length - 1 : prev - 1));
  };

  const handleNextLeader = () => {
    setActiveLeaderIdx((prev) => (prev === leadersData.length - 1 ? 0 : prev + 1));
  };

  const scrollProductsNext = () => {
    if (productsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productsScrollRef.current;
      const tileWidth = 140;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        productsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        productsScrollRef.current.scrollBy({ left: tileWidth, behavior: 'smooth' });
      }
    }
  };

  const currentLeader = leadersData[activeLeaderIdx];

  const handleAction = () => {
    navigate('/login');
  };

  return (
    <section className="figma-mid-sections-wrap">
      {/* ================= ROW 1: Opportunities (Left) & Leaders (Right) ================= */}
      <div className="figma-two-col-container">
        {/* LEFT BOX: Find Your Next Business Opportunity */}
        <div className="figma-biz-box figma-box-opp" id="opportunities">
          <div className="figma-box-header">
            <div className="figma-box-tag">
              <img src={iconNetwork} alt="" className="figma-box-tag-icon" />
              <span>EXPLORE FORTAA</span>
            </div>
            <h2 className="figma-box-title">Find Your Next Business Opportunity</h2>
            <p className="figma-box-subtitle">
              Browse opportunities from businesses looking to connect with distributors,
              partners and entrepreneurs.
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
                  <span>Services &amp; categories</span>
                </div>
                <div className="figma-opp-check-item">
                  <span className="figma-check-mark">✓</span>
                  <span>Contact information</span>
                </div>
              </div>

              <div className="figma-opp-action-row">
                <button
                  type="button"
                  onClick={handleAction}
                  className="figma-btn-purple figma-action-btn"
                >
                  <span>View Opportunity</span>
                  <img src={iconRightArrow} alt="" />
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  className="figma-link-arrow figma-action-link"
                >
                  <span>Explore All Opportunity</span>
                  <img src={iconRightArrow} alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BOX: Industry Leaders */}
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
              <img
                key={currentLeader.name}
                src={currentLeader.avatar}
                alt={currentLeader.name}
                className="figma-leader-avatar-animated"
              />
            </div>

            <div className="figma-leader-info-wrap" key={activeLeaderIdx}>
              <h3 className="figma-leader-name">{currentLeader.name}</h3>

              <div className="figma-leader-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B128D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>{currentLeader.role}</span>
              </div>

              <div className="figma-leader-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B128D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                <span>{currentLeader.exp}</span>
              </div>

              <div className="figma-leader-actions-row">
                <button
                  type="button"
                  onClick={handleAction}
                  className="figma-btn-purple figma-action-btn"
                >
                  <span>View Profile</span>
                  <img src={iconRightArrow} alt="" />
                </button>

                <div className="figma-carousel-arrows">
                  <button
                    type="button"
                    aria-label="Previous leader"
                    onClick={handlePrevLeader}
                    className="figma-leader-nav-arrow"
                    title="Previous leader"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#750192" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Next leader"
                    onClick={handleNextLeader}
                    className="figma-leader-nav-arrow"
                    title="Next leader"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#750192" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="figma-dots-and-link">
                <div className="figma-carousel-dots">
                  {leadersData.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={() => setActiveLeaderIdx(idx)}
                      className={`dot ${activeLeaderIdx === idx ? 'active' : ''}`}
                      title={leadersData[idx].name}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAction}
                  className="figma-link-arrow figma-action-link"
                >
                  <span>Explore All Opportunity</span>
                  <img src={iconRightArrow} alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ROW 2: Featured Services (Left) & Spotlight/Promotions (Right) ================= */}
      <div className="figma-two-col-container">
        {/* LEFT BOX: Featured Services */}
        <div className="figma-biz-box figma-box-products" id="services">
          <div className="figma-box-header">
            <div className="figma-box-tag">
              <img src={iconNetwork} alt="" className="figma-box-tag-icon" />
              <span>FEATURED SERVICES</span>
            </div>
            <h2 className="figma-box-title figma-title-pink">Discover Featured Services</h2>
            <p className="figma-box-subtitle">
              Popular services, training and solutions from organizations listed on our platform.
            </p>
          </div>

          <div className="figma-products-outer-wrap">
            <div className="figma-products-inner-card" ref={productsScrollRef}>
              {serviceCategories.map((item) => (
                <div
                  key={item.label}
                  onClick={handleAction}
                  className={`figma-prod-tile ${item.active ? 'active-tile' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  {item.active && (
                    <span className="figma-prod-hot-pill">Hot Opportunity</span>
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

            {/* Pink Next Arrow */}
            <button
              type="button"
              className="figma-prod-next-arrow"
              aria-label="Next services"
              onClick={scrollProductsNext}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT BOX: Put Your Business in the Spotlight / Promotions */}
        <div className="figma-biz-box figma-box-spotlight" id="promotions">
          <div className="figma-spotlight-left-content">
            <h2 className="figma-spotlight-title">
              Put your Business
              <br />
              in the spotlight
            </h2>
            <p className="figma-spotlight-desc">
              Reach a relevant audience and increase visibility for your company,
              services and business opportunities.
            </p>

            {/* 3 mini benefit cards */}
            <div className="figma-spotlight-cards-row">
              <div className="figma-spotlight-mini-card">
                <span className="figma-spotlight-card-heading">Featured Placement</span>
                <span className="figma-spotlight-card-sub">Gain trust across our active network</span>
              </div>
              <div className="figma-spotlight-mini-card">
                <span className="figma-spotlight-card-heading">Brand Visibility</span>
                <span className="figma-spotlight-card-sub">Showcase your brand and premium services.</span>
              </div>
              <div className="figma-spotlight-mini-card">
                <span className="figma-spotlight-card-heading">Targeted Promotion</span>
                <span className="figma-spotlight-card-sub">Connect with verified entrepreneurs.</span>
              </div>
            </div>

            <div className="figma-spotlight-actions-row">
              <button
                type="button"
                onClick={handleAction}
                className="figma-btn-magenta figma-action-btn"
              >
                <span>Advertise With Fortaa</span>
                <img src={iconRightArrow} alt="" />
              </button>
              <button
                type="button"
                onClick={handleAction}
                className="figma-spotlight-underline-link figma-action-link"
              >
                View Advertising Plans
              </button>
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
