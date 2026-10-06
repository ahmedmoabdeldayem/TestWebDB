import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import './Checkout.css';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    zip: '',
    country: 'United States',
    payment: 'demo_card',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) return;
    setError('');
    setLoading(true);

    const shipping = `${form.fullName}, ${form.address}, ${form.city} ${form.zip}, ${form.country}`;

    try {
      const { orderId } = await api.createOrder(shipping);
      await clearCart();
      navigate(`/orders`, { state: { newOrderId: orderId } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const shipping = subtotal >= 25 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="page-container checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      {items.length === 0 ? (
        <div className="loading-spinner">Your cart is empty.</div>
      ) : (
        <form className="checkout-layout" onSubmit={handleSubmit}>
          {/* Left: Shipping + Payment */}
          <div className="checkout-left">
            {/* Shipping */}
            <div className="card checkout-section">
              <h2 className="checkout-section-title">1. Shipping address</h2>

              <div className="form-row">
                <label className="form-label">
                  Full name
                  <input className="form-input" value={form.fullName} onChange={set('fullName')} required />
                </label>
              </div>
              <div className="form-row">
                <label className="form-label">
                  Address
                  <input className="form-input" value={form.address} onChange={set('address')} required placeholder="Street address" />
                </label>
              </div>
              <div className="form-row-2">
                <label className="form-label">
                  City
                  <input className="form-input" value={form.city} onChange={set('city')} required />
                </label>
                <label className="form-label">
                  ZIP code
                  <input className="form-input" value={form.zip} onChange={set('zip')} required />
                </label>
              </div>
              <div className="form-row">
                <label className="form-label">
                  Country
                  <select className="form-input" value={form.country} onChange={set('country')}>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>Australia</option>
                    <option>Germany</option>
                    <option>France</option>
                    <option>Egypt</option>
                    <option>UAE</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Payment */}
            <div className="card checkout-section">
              <h2 className="checkout-section-title">2. Payment method</h2>
              <div className="demo-notice">
                This is a demo store. No real payments are processed.
              </div>
              {[
                { value: 'demo_card', label: 'Credit / Debit Card (Demo)' },
                { value: 'demo_paypal', label: 'PayPal (Demo)' },
                { value: 'demo_cod', label: 'Cash on Delivery (Demo)' },
              ].map((opt) => (
                <label key={opt.value} className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value={opt.value}
                    checked={form.payment === opt.value}
                    onChange={set('payment')}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {/* Review Items */}
            <div className="card checkout-section">
              <h2 className="checkout-section-title">3. Review items</h2>
              {items.map((item) => (
                <div key={item.id} className="review-item">
                  <img src={item.image_url} alt={item.name} className="review-item-img" />
                  <div>
                    <p className="review-item-name">{item.name}</p>
                    <p className="price">${item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary card">
            <h2 className="checkout-section-title">Order Summary</h2>

            <div className="summary-row">
              <span>Items ({items.reduce((s, i) => s + i.quantity, 0)}):</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>{shipping === 0 ? <span style={{ color: 'var(--clr-green)' }}>FREE</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="summary-row">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <hr className="divider" />
            <div className="summary-row summary-total">
              <span>Order total:</span>
              <span className="price">${total.toFixed(2)}</span>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn-orange checkout-place-btn" disabled={loading}>
              {loading ? 'Placing order...' : 'Place your order'}
            </button>

            <p className="checkout-legal">
              By placing your order, you agree to ShopHub's conditions of use. This is a demo — no real charge will occur.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
