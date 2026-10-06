const { db } = require('../models/db');

function getAll(req, res) {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && typeof category === 'string' && category.length > 100) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (search && typeof search === 'string' && search.length > 100) {
    return res.status(400).json({ error: 'Search term too long' });
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY review_count DESC';
  res.json(db.prepare(query).all(...params));
}

function getOne(req, res) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
}

function getCategories(req, res) {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(rows.map((r) => r.category));
}

module.exports = { getAll, getOne, getCategories };
