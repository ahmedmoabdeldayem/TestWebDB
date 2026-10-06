const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/db');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'Strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Name must be under 100 characters' });
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be 8–128 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    // Generic message to avoid confirming which emails are registered
    return res.status(409).json({ error: 'Could not create account with that email' });
  }

  const password_hash = bcrypt.hashSync(password, 12);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name.trim(), email.toLowerCase().trim(), password_hash);

  const user = { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim() };
  res.cookie('token', signToken(user), COOKIE_OPTS);
  res.status(201).json({ user });
}

function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Select only needed columns — never expose password_hash beyond this check
  const user = db
    .prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase().trim());

  // Use constant-time comparison via bcrypt to prevent timing attacks
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email };
  res.cookie('token', signToken(safeUser), COOKIE_OPTS);
  res.json({ user: safeUser });
}

function logout(_req, res) {
  res.clearCookie('token', { sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out' });
}

function me(req, res) {
  const user = db
    .prepare('SELECT id, name, email, address, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { register, login, logout, me };
