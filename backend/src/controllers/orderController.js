const { db } = require('../models/db');

function createOrder(req, res) {
  const { shipping_address } = req.body;
  const userId = req.user.id;

  if (!shipping_address || typeof shipping_address !== 'string') {
    return res.status(400).json({ error: 'Shipping address is required' });
  }
  if (shipping_address.length > 500) {
    return res.status(400).json({ error: 'Shipping address is too long' });
  }

  const cartItems = db.prepare(`
    SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(userId);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = db.transaction(() => {
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        throw Object.assign(new Error(`Insufficient stock for "${item.name}"`), { status: 400 });
      }
    }

    const order = db
      .prepare('INSERT INTO orders (user_id, total, shipping_address) VALUES (?, ?, ?)')
      .run(userId, total, shipping_address.trim());

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, name, quantity, price)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of cartItems) {
      insertItem.run(order.lastInsertRowid, item.product_id, item.name, item.quantity, item.price);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
        .run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    return order.lastInsertRowid;
  });

  const orderId = placeOrder();
  res.status(201).json({ message: 'Order placed successfully', orderId });
}

function getOrders(req, res) {
  const orders = db.prepare(`
    SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  if (orders.length === 0) return res.json([]);

  const ids = orders.map((o) => o.id);
  const allItems = db.prepare(`
    SELECT oi.*, p.image_url FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN (${ids.map(() => '?').join(',')})
  `).all(...ids);

  const itemsByOrder = {};
  for (const item of allItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }

  const withItems = orders.map((order) => ({
    ...order,
    items: itemsByOrder[order.id] ?? [],
  }));

  res.json(withItems);
}

function getOrder(req, res) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.items = db.prepare(`
    SELECT oi.*, p.image_url FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(order.id);

  res.json(order);
}

module.exports = { createOrder, getOrders, getOrder };
