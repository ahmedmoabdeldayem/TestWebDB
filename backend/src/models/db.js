const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(__dirname, '../../../database');
const DB_PATH = path.join(DB_DIR, 'shop.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (!encryptionKey) throw new Error('DB_ENCRYPTION_KEY is not set in environment');

const db = new Database(DB_PATH);
db.pragma("cipher='sqlcipher'");
// Use hex key pragma so single quotes or special chars in the key never break the PRAGMA string.
db.pragma(`key="x'${Buffer.from(encryptionKey, 'utf8').toString('hex')}'"`);

function initDatabase() {
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    UNIQUE NOT NULL,
      password_hash TEXT  NOT NULL,
      address     TEXT    DEFAULT '',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      description  TEXT,
      price        REAL    NOT NULL,
      image_url    TEXT,
      category     TEXT    NOT NULL,
      stock        INTEGER DEFAULT 100,
      rating       REAL    DEFAULT 4.0,
      review_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity   INTEGER DEFAULT 1,
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE (user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id          INTEGER NOT NULL,
      total            REAL    NOT NULL,
      status           TEXT    DEFAULT 'Processing',
      shipping_address TEXT,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      name       TEXT    NOT NULL,
      quantity   INTEGER NOT NULL,
      price      REAL    NOT NULL,
      FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  if (count === 0) seedProducts(db);

  console.log(`Database ready at: ${DB_PATH}`);
}

function seedProducts(db) {
  const products = require('../seed/products');
  const insert = db.prepare(`
    INSERT INTO products (name, description, price, image_url, category, stock, rating, review_count)
    VALUES (@name, @description, @price, @image_url, @category, @stock, @rating, @review_count)
  `);
  const insertAll = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
  insertAll(products);
  console.log(`Seeded ${products.length} products`);
}

module.exports = { db, initDatabase };
