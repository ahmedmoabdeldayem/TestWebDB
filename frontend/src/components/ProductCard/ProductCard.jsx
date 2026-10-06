import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StarRating from '../StarRating/StarRating';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleAddToCart(e) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    await addToCart(product.id);
  }

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-img-wrap">
        <img src={product.image_url} alt={product.name} className="product-card-img" loading="lazy" />
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <StarRating rating={product.rating} count={product.review_count} size={13} />
        <div className="product-card-price">
          <span className="price">${product.price.toFixed(2)}</span>
        </div>
        <div className="prime-badge">&#10003; FREE Delivery by ShopHub Prime</div>
        <button className="btn-primary product-card-btn" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
