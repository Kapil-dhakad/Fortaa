import './BusinessSpotlight.css';

const features = [
    {
        icon: '🏆',
        title: 'Featured Placement',
        desc: 'Get trustworthy coverage across our sections.',
    },
    {
        icon: '🌟',
        title: 'Brand Visibility',
        desc: 'Showcase your brand, products and services.',
    },
    {
        icon: '🎯',
        title: 'Targeted Promotion',
        desc: 'Connect with a reviews audience.',
    },
];

export default function BusinessSpotlight() {
    return (
        <section className="spotlight" id="promotions">
            <div className="container">
                <div className="spotlight-inner">
                    <div className="spotlight-left">
                        <div className="section-label light">✦ PUT YOUR BUSINESS IN THE SPOTLIGHT</div>
                        <h2 className="spotlight-title">
                            Put your Business<br />in the spotlight
                        </h2>
                        <p className="spotlight-desc">
                            Reach a relevant audience and increase visibility
                            for your company, products and business opportunities.
                        </p>
                        <div className="spotlight-features">
                            {features.map((f, i) => (
                                <div key={i} className="spotlight-feature">
                                    <div className="sf-icon">{f.icon}</div>
                                    <div>
                                        <h5 className="sf-title">{f.title}</h5>
                                        <p className="sf-desc">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="spotlight-actions">
                            <a href="#" className="btn-primary">Advertise With Fortaa →</a>
                            <a href="#" className="spotlight-link">View Advertising Plans</a>
                        </div>
                    </div>
                    <div className="spotlight-right">
                        <div className="spotlight-illustration">
                            <div className="si-rocket">🚀</div>
                            <div className="si-ring si-ring-1" />
                            <div className="si-ring si-ring-2" />
                            <div className="si-ring si-ring-3" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
