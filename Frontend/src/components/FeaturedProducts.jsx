import './FeaturedProducts.css';

const categories = ['Health & Wellness', 'Beauty & Personal Care', 'Lifestyle', 'Home & Computer', 'Nutrition'];

const products = [
    { name: 'NutriShake Pro', brand: 'Herbalife', category: 'Nutrition', price: '₹1,299', emoji: '🥤', color: '#27ae60' },
    { name: 'Aloe Vera Gel', brand: 'Forever Living', category: 'Health', price: '₹899', emoji: '🌿', color: '#16a34a' },
    { name: 'Skin Perfection', brand: 'Oriflame', category: 'Beauty', price: '₹649', emoji: '✨', color: '#e74c3c' },
    { name: 'Daily Nutrition Pack', brand: 'Amway', category: 'Wellness', price: '₹2,199', emoji: '💊', color: '#1a73e8' },
];

export default function FeaturedProducts() {
    return (
        <section className="featured-products section" id="products">
            <div className="container">
                <div className="section-header">
                    <div>
                        <div className="section-label">✦ FEATURED PRODUCTS</div>
                        <h2 className="section-title">Discover Featured Products</h2>
                        <p className="section-subtitle">Popular products and brands from companies listed on our platform.</p>
                    </div>
                    <a href="#" className="view-all-link">View All →</a>
                </div>

                {/* Category pills */}
                <div className="product-cats">
                    {categories.map((cat, i) => (
                        <button key={i} className={`cat-pill ${i === 0 ? 'active' : ''}`}>{cat}</button>
                    ))}
                </div>

                {/* Products grid */}
                <div className="products-grid">
                    {products.map((product, i) => (
                        <div key={i} className="product-card">
                            <div
                                className="product-thumb"
                                style={{ background: `${product.color}15` }}
                            >
                                <span className="product-emoji">{product.emoji}</span>
                            </div>
                            <div className="product-info">
                                <span className="product-category">{product.category}</span>
                                <h4 className="product-name">{product.name}</h4>
                                <p className="product-brand">{product.brand}</p>
                                <div className="product-footer">
                                    <span className="product-price">{product.price}</span>
                                    <button className="btn-view-product">View →</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
