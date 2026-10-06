import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating/StarRating';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    api.getProduct(id).then(setProduct).finally(() => setLoading(false));
  }, [id]);

  async function handleAddToCart() {
    if (!user) { navigate('/login'); return; }
    await addToCart(product.id, qty);
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 3000);
  }

  async function handleBuyNow() {
    if (!user) { navigate('/login'); return; }
    await addToCart(product.id, qty);
    navigate('/checkout');
  }

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!product) return <div className="loading-spinner">Product not found.</div>;

  const qtyOptions = Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1);

  return (
    <div className="page-container product-detail-page">
      <div className="product-detail-grid">
        {/* Image */}
        <div className="product-detail-img-wrap">
          <img src={product.image_url} alt={product.name} className="product-detail-img" />
        </div>

        {/* Info */}
        <div className="product-detail-info">
          <p className="product-detail-category">{product.category}</p>
          <h1 className="product-detail-name">{product.name}</h1>

          <div className="product-detail-rating">
            <StarRating rating={product.rating} count={product.review_count} size={16} />
          </div>

          <hr className="divider" />

          <div className="product-detail-price">
            <span className="price-label">Price: </span>
            <span className="price" style={{ fontSize: 26 }}>${product.price.toFixed(2)}</span>
          </div>

          <p className="prime-badge" style={{ marginTop: 4 }}>
            &#10003; FREE delivery on orders over $25
          </p>

          <hr className="divider" />

          <p className="product-detail-desc">{product.description}</p>
        </div>

        {/* Buy Box */}
        <div className="buy-box card">
          <div className="buy-box-price">
            <span className="price">${product.price.toFixed(2)}</span>
          </div>

          <p className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </p>

          <p className="prime-badge" style={{ fontSize: 12 }}>FREE Prime Delivery</p>

          {product.stock > 0 && (
            <>
              <label className="qty-label">
                Qty:
                <select
                  className="qty-select"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                >
                  {qtyOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>

              <button className="btn-primary buy-box-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="btn-orange buy-box-btn" onClick={handleBuyNow}>
                Buy Now
              </button>

              {addedMsg && <p className="added-msg">{addedMsg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
