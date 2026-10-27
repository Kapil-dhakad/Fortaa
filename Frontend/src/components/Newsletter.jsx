import { useState } from 'react';
import nlEmailIcon from '../assets/figma/nl_email_icon.png';
import './Newsletter.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <section className="figma-newsletter-section" id="newsletter">
      <div className="figma-newsletter-wrapper">
        <div className="figma-newsletter-container">
          {/* Left Block: Email icon + Headlines */}
          <div className="figma-nl-left">
            <div className="figma-nl-icon-wrap">
              <img src={nlEmailIcon} alt="Email" className="figma-nl-email-img" />
            </div>
            <div className="figma-nl-text-wrap">
              <h3 className="figma-nl-title">Stay Connected With the Industry</h3>
              <p className="figma-nl-desc">
                Get latest business opportunities, industry news,events and featured companies delivered to your inbox.
              </p>
            </div>
          </div>

          {/* Right Block: Input pill + Subscribe button + Unsubscribe note */}
          <div className="figma-nl-right">
            {subscribed ? (
              <div className="figma-nl-success">
                <span>🎉</span> Thank you! You&apos;re now subscribed to updates.
              </div>
            ) : (
              <form className="figma-nl-form-capsule" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="figma-nl-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="figma-nl-btn-submit">
                  <span>Subscribe</span>
                  <span className="figma-nl-arrow">&rarr;</span>
                </button>
              </form>
            )}
            <p className="figma-nl-privacy">No problem, Unsubscribe anyone</p>
          </div>
        </div>
      </div>
    </section>
  );
}

