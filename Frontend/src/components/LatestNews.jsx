import iconNetwork from '../assets/figma/icon_network.png';
import iconRightArrow from '../assets/figma/icon_right_arrow.png';
import newsMeeting from '../assets/figma/news_meeting.png';
import priyaSharma from '../assets/figma/priya_sharma.png';
import './LatestNews.css';

const newsArticles = [
  {
    category: 'Industry Insights',
    title: 'Understanding the changing direct-selling landscape',
    date: '12 Nov 2026 - 5 min read',
  },
  {
    category: 'Business Trends',
    title: 'Emerging trends shaping modern network marketing',
    date: '03 Nov 2026 - 4 min read',
  },
  {
    category: 'Product Updates',
    title: 'New product launches and industry developments',
    date: '05 Nov 2026 - 3 min read',
  },
];

const eventsList = [
  {
    date: '20',
    month: 'NOV',
    title: 'Leadership Summit',
    location: 'Online',
    btnLabel: 'Register',
  },
  {
    date: '20',
    month: 'NOV',
    title: 'Industry Networking Meet',
    location: 'New Delhi',
    btnLabel: 'View Event',
  },
  {
    date: '20',
    month: 'NOV',
    title: 'Business Growth Workshop',
    location: 'Online',
    btnLabel: 'View Event',
  },
];

export default function LatestNews() {
  return (
    <section className="figma-three-block-section" id="news">
      <div className="figma-three-block-container">
        {/* ================= COLUMN 1 (~50% width): Latest News & Updates ================= */}
        <div className="figma-col-news">
          <div className="figma-news-header">
            <span className="figma-news-tag">LATEST FROM THE INDUSTRY</span>
            <h2 className="figma-news-title">Latest News &amp; Updates</h2>
            <p className="figma-news-subtitle">
              Insights, trends and updates from the world of direct selling and network marketing.
            </p>
          </div>

          <div className="figma-news-cards-row">
            {newsArticles.map((art, idx) => (
              <div key={idx} className="figma-article-card">
                <div className="figma-article-thumb-box">
                  <img src={newsMeeting} alt={art.title} className="figma-article-img" />
                </div>

                <div className="figma-article-body">
                  <span className="figma-article-badge">{art.category}</span>
                  <h4 className="figma-article-title">{art.title}</h4>
                  <span className="figma-article-date">{art.date}</span>
                  <a href="#read" className="figma-article-read-btn">
                    <span>Read Article</span>
                    <img src={iconRightArrow} alt="" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= COLUMN 2 (~25% width): SUCCESS STORIES ================= */}
        <div className="figma-col-success" id="growth">
          <div className="figma-subcol-header">
            <div className="figma-subcol-tag">
              <img src={iconNetwork} alt="" className="figma-tag-network-icon" />
              <span>SUCCESS STORIES</span>
            </div>
            <h2 className="figma-growth-main-title">Stories of Growth</h2>
            <p className="figma-growth-sub-desc">
              Real experiences, business journeys and lessons from professionals across the industry.
            </p>
          </div>

          <div className="figma-growth-card-container">
            <div className="figma-growth-testimonial-box">
              <div className="figma-growth-avatar-wrap">
                <img src={priyaSharma} alt="Priya Sharma" />
              </div>
              <div className="figma-growth-quote-info">
                <p className="figma-growth-quote">
                  &ldquo;FORTAA helped me connect with the right people and grow my business step by step.&rdquo;
                </p>
                <h4 className="figma-growth-author-name">Priya Sharma</h4>
                <span className="figma-growth-author-role">Team Leader</span>
              </div>
            </div>

            <a href="#story" className="figma-btn-success-story">
              <span>Read Success Story</span>
              <img src={iconRightArrow} alt="" />
            </a>
          </div>
        </div>

        {/* ================= COLUMN 3 (~25% width): UPCOMING EVENTS ================= */}
        <div className="figma-col-events">
          <div className="figma-subcol-header">
            <div className="figma-events-tag-row">
              <div className="figma-subcol-tag">
                <img src={iconNetwork} alt="" className="figma-tag-network-icon" />
                <span>UPCOMING EVENTS</span>
              </div>
              <a href="#all-events" className="figma-growth-view-all">
                <span>View All Categories</span>
                <img src={iconRightArrow} alt="" />
              </a>
            </div>
            <p className="figma-growth-sub-desc events-desc">
              Be part of industry Events, workshops and Networking meets.
            </p>
          </div>

          <div className="figma-events-cards-container">
            {eventsList.map((ev, idx) => (
              <div key={idx} className="figma-growth-event-card">
                <div className="figma-event-date-badge">
                  <span className="event-date-num">{ev.date}</span>
                  <span className="event-date-month">{ev.month}</span>
                </div>

                <div className="figma-event-info-col">
                  <h5 className="figma-event-name">{ev.title}</h5>
                  <span className="figma-event-location">
                    <span className="event-loc-circle" />
                    {ev.location}
                  </span>
                </div>

                <a href="#event" className="figma-event-action-pill">
                  <span>{ev.btnLabel}</span>
                  <img src={iconRightArrow} alt="" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

}
