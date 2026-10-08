const { db } = require('../models/db');

function getCart(req, res) {
  const items = db.prepare(`
    SELECT ci.id, ci.quantity,
           p.id AS product_id, p.name, p.price, p.image_url, p.stock, p.rating
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(req.user.id);
  res.json(items);
}

function addItem(req, res) {
  const { product_id } = req.body;
  const quantity = parseInt(req.body.quantity, 10) || 1;
  const userId = req.user.id;

  if (!product_id || !Number.isInteger(Number(product_id)) || Number(product_id) < 1) {
    return res.status(400).json({ error: 'Invalid product_id' });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 100' });
  }

  const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db
    .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(userId, product_id);

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)')
      .run(userId, product_id, Math.min(quantity, product.stock));
  }

  res.json({ message: 'Item added to cart' });
}

function updateItem(req, res) {
  const quantity = parseInt(req.body.quantity, 10);
  const { itemId } = req.params;

  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100) {
    return res.status(400).json({ error: 'Quantity must be between 0 and 100' });
  }

  if (quantity === 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?')
      .run(itemId, req.user.id);
    return res.json({ message: 'Item removed' });
  }

  const result = db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?')
    .run(quantity, itemId, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
  res.json({ message: 'Cart updated' });
}

function removeItem(req, res) {
  const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?')
    .run(req.params.itemId, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
  res.json({ message: 'Item removed' });
}

function clearCart(req, res) {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared' });
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
