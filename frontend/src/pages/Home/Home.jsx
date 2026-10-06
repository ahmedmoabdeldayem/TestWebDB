import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.css';

const HERO_SLIDES = [
  { bg: '#232f3e', title: 'Deals on Electronics', sub: 'Top picks across all categories', color: '#FF9900' },
  { bg: '#1a3c5e', title: 'Fresh New Books', sub: 'Expand your knowledge & imagination', color: '#FFD814' },
  { bg: '#3d1c02', title: 'Home & Kitchen Essentials', sub: 'Everything for your home', color: '#FF9900' },
];

export default function Home() {
  const { name: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const params = {};
    if (categoryParam) params.category = decodeURIComponent(categoryParam);
    if (searchQuery) params.search = searchQuery;

    setLoading(true);
    Promise.all([api.getProducts(params), api.getCategories()])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); })
      .finally(() => setLoading(false));
  }, [categoryParam, searchQuery]);

  useEffect(() => {
    if (categoryParam || searchQuery) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [categoryParam, searchQuery]);

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = products.filter((p) => p.category === cat);
    return acc;
  }, {});

  const showHero = !categoryParam && !searchQuery;
  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : categoryParam
    ? decodeURIComponent(categoryParam)
    : null;

  return (
    <div>
      {showHero && (
        <div className="hero" style={{ background: HERO_SLIDES[slide].bg }}>
          <div className="hero-content">
            <h1 style={{ color: HERO_SLIDES[slide].color }}>{HERO_SLIDES[slide].title}</h1>
            <p>{HERO_SLIDES[slide].sub}</p>
          </div>
          <div className="hero-dots">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} className={`hero-dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>
      )}

      <div className="page-container home-body">
        {pageTitle && <h2 className="section-heading">{pageTitle}</h2>}

        {loading ? (
          <div className="loading-spinner">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="loading-spinner">No products found.</div>
        ) : pageTitle ? (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          categories.map((cat) =>
            grouped[cat]?.length > 0 ? (
              <section key={cat} className="category-section">
                <h2 className="section-heading">{cat}</h2>
                <div className="product-grid">
                  {grouped[cat].map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            ) : null
          )
        )}
      </div>
    </div>
  );
}
