import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../../api/client';
import './Orders.css';

const STATUS_COLOR = {
  Processing: '#e47911',
  Shipped: 'var(--clr-blue-link)',
  Delivered: 'var(--clr-green)',
  Cancelled: 'var(--clr-red)',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const newOrderId = location.state?.newOrderId;

  useEffect(() => {
    api.getOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner">Loading orders...</div>;

  return (
    <div className="page-container orders-page">
      <h1 className="orders-title">Your Orders</h1>

      {newOrderId && (
        <div className="order-success-banner">
          Order #{newOrderId} placed successfully! Thank you for shopping with ShopHub.
        </div>
      )}

      {orders.length === 0 ? (
        <div className="orders-empty card">
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card card">
              <div className="order-header">
                <div className="order-meta">
                  <div>
                    <span className="meta-label">ORDER PLACED</span>
                    <span className="meta-val">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label">TOTAL</span>
                    <span className="meta-val">${order.total.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="meta-label">SHIP TO</span>
                    <span className="meta-val">{order.shipping_address?.split(',')[0]}</span>
                  </div>
                </div>
                <div className="order-id-status">
                  <span className="order-id">Order #{order.id}</span>
                  <span
                    className="order-status"
                    style={{ color: STATUS_COLOR[order.status] || 'var(--clr-text)' }}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <img
                      src={item.image_url || 'https://picsum.photos/seed/product/80/80'}
                      alt={item.name}
                      className="order-item-img"
                    />
                    <div className="order-item-info">
                      <p className="order-item-name">{item.name}</p>
                      <p className="order-item-qty">Qty: {item.quantity}</p>
                      <p className="price">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span style={{ color: 'var(--clr-text-muted)', fontSize: 13 }}>
                  Shipped to: {order.shipping_address}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
