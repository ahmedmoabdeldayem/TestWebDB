const BASE = '/api';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include', // send/receive httpOnly cookies automatically
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => request('/auth/logout',   { method: 'POST' }),
  me:       ()     => request('/auth/me'),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct:   (id) => request(`/products/${id}`),
  getCategories: ()  => request('/products/categories'),

  // Cart
  getCart:        ()              => request('/cart'),
  addToCart:      (product_id, quantity = 1) =>
    request('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  updateCartItem: (itemId, quantity) =>
    request(`/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (itemId) => request(`/cart/${itemId}`, { method: 'DELETE' }),
  clearCart:      ()       => request('/cart/clear',     { method: 'DELETE' }),

  // Orders
  getOrders:   ()    => request('/orders'),
  getOrder:    (id)  => request(`/orders/${id}`),
  createOrder: (shipping_address) =>
    request('/orders', { method: 'POST', body: JSON.stringify({ shipping_address }) }),
};
