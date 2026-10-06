import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './Cart.css';

export default function Cart() {
  const { items, subtotal, updateItem, removeItem, loading } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="loading-spinner">Loading cart...</div>;

  return (
    <div className="page-container cart-page">
      <h1 className="cart-title">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your ShopHub Cart is empty.</p>
          <Link to="/" className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.id} className="cart-item card">
                <img src={item.image_url} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <Link to={`/product/${item.product_id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <p className="price" style={{ fontSize: 18 }}>${item.price.toFixed(2)}</p>
                  <p className="cart-item-stock" style={{ color: 'var(--clr-green)', fontSize: 13 }}>In Stock</p>

                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                      >−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >+</button>
                    </div>
                    <span className="cart-sep">|</span>
                    <button className="cart-action-link" onClick={() => removeItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="cart-item-subtotal">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}

            <p className="cart-subtotal-note">
              Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):&nbsp;
              <strong>${subtotal.toFixed(2)}</strong>
            </p>
          </div>

          {/* Summary */}
          <div className="cart-summary card">
            <p className="cart-summary-title">
              Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):&nbsp;
              <strong>${subtotal.toFixed(2)}</strong>
            </p>
            <p className="prime-badge" style={{ fontSize: 13 }}>
              Your order is eligible for FREE Delivery
            </p>
            <button
              className="btn-primary cart-checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
