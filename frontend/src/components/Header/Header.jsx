import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/?search=${encodeURIComponent(query.trim())}`);
    else navigate('/');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="header">
      <div className="header-main">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <span className="logo-text">shop</span>
          <span className="logo-hub">hub</span>
        </Link>

        {/* Search */}
        <form className="header-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 2a8 8 0 105.293 14.293l4.207 4.207 1.414-1.414-4.207-4.207A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z"/>
            </svg>
          </button>
        </form>

        {/* Account */}
        <div className="header-account">
          {user ? (
            <div className="account-menu">
              <span className="account-greeting">Hello, {user.name.split(' ')[0]}</span>
              <div className="account-dropdown">
                <Link to="/orders">Your Orders</Link>
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="header-btn">
              <span className="btn-sub">Hello, Sign in</span>
              <span className="btn-main">Account &amp; Lists</span>
            </Link>
          )}
        </div>

        {/* Orders */}
        {user && (
          <Link to="/orders" className="header-btn">
            <span className="btn-sub">Returns</span>
            <span className="btn-main">&amp; Orders</span>
          </Link>
        )}

        {/* Cart */}
        <Link to="/cart" className="header-cart">
          <div className="cart-icon-wrap">
            <svg width="34" height="28" viewBox="0 0 34 28" fill="currentColor">
              <path d="M0 2h4l5.5 14h14L28 6H8" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="13" cy="24" r="2"/>
              <circle cx="23" cy="24" r="2"/>
            </svg>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </div>
          <span className="btn-main">Cart</span>
        </Link>
      </div>

      {/* Sub-nav */}
      <nav className="header-sub">
        <div className="subnav-inner page-container">
          <Link to="/" className="subnav-link">All</Link>
          {['Electronics', 'Books', 'Home & Kitchen', 'Sports', 'Fashion'].map((cat) => (
            <Link key={cat} to={`/category/${encodeURIComponent(cat)}`} className="subnav-link">
              {cat}
            </Link>
          ))}
          <Link to="/orders" className="subnav-link">Today's Deals</Link>
        </div>
      </nav>
    </header>
  );
}
