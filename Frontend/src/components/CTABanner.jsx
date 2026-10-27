import ctaRocket from '../assets/figma/cta_rocket.png';
import iconRightArrow from '../assets/figma/icon_right_arrow.png';
import './CTABanner.css';

export default function CTABanner() {
  return (
    <section className="figma-cta-section" id="cta-banner">
      <div className="figma-cta-wrapper">
        <div className="figma-cta-container">
          {/* Subtle background glow effect */}
          <div className="figma-cta-glow-center" />

          {/* Left content: Rocket icon + Text */}
          <div className="figma-cta-left">
            <div className="figma-cta-icon-wrap">
              <img src={ctaRocket} alt="Rocket" className="figma-cta-rocket-img" />
            </div>
            <div className="figma-cta-text-wrap">
              <h3 className="figma-cta-heading">Ready to Grow your Visibility?</h3>
              <p className="figma-cta-subtext">
                Whether you&apos;re launching a campaign, promoting a product or listing your new business, connect with a relevant audience and get the visibility you deserve.&rdquo;
              </p>
            </div>
          </div>

          {/* Right actions: 2 Buttons */}
          <div className="figma-cta-actions">
            <a href="#create-listing" className="figma-cta-btn-white">
              <span>Create your Listing</span>
              <img src={iconRightArrow} alt="" className="figma-btn-arrow-pink" />
            </a>
            <a href="#talk-team" className="figma-cta-btn-outline">
              <span>Talk to Our Team</span>
              <span className="figma-arrow-symbol">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

