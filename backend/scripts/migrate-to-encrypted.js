#!/usr/bin/env node
/**
 * Migration script: converts a plain SQLite database to SQLCipher-encrypted.
 * Steps:
 *   1. Export all data from the existing plain database
 *   2. Delete the plain database
 *   3. Open a new encrypted database with the key
 *   4. Re-create the schema and re-import all data
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const BetterSqlite = require('better-sqlite3-multiple-ciphers');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '../../database/shop.sqlite');
const BACKUP_PATH = DB_PATH + '.backup';

const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (!encryptionKey) {
  console.error('DB_ENCRYPTION_KEY is not set in .env');
  process.exit(1);
}

// ── 1. Open the existing chacha20-encrypted database and export all data ─────
console.log('Reading existing database...');
const plain = new BetterSqlite(DB_PATH);
plain.pragma("cipher='chacha20'");
plain.pragma(`key='${encryptionKey}'`);

const tables = ['users', 'products', 'cart_items', 'orders', 'order_items'];
const data = {};
for (const table of tables) {
  try {
    data[table] = plain.prepare(`SELECT * FROM ${table}`).all();
    console.log(`  ${table}: ${data[table].length} rows`);
  } catch {
    data[table] = [];
    console.log(`  ${table}: (table not found, skipping)`);
  }
}
plain.close();

// ── 2. Backup then delete the plain database ─────────────────────────────────
fs.copyFileSync(DB_PATH, BACKUP_PATH);
console.log(`Backup saved to ${BACKUP_PATH}`);
fs.unlinkSync(DB_PATH);
console.log('Plain database deleted.');

// ── 3. Create a new SQLCipher (AES) encrypted database ──────────────────────
console.log('Creating SQLCipher-encrypted database...');
const enc = new BetterSqlite(DB_PATH);
enc.pragma("cipher='sqlcipher'");
enc.pragma(`key='${encryptionKey}'`);

// ── 4. Re-create schema ──────────────────────────────────────────────────────
enc.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    address       TEXT    DEFAULT '',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
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

// ── 5. Re-import data ────────────────────────────────────────────────────────
const insertUsers = enc.prepare(
  'INSERT OR IGNORE INTO users (id, name, email, password_hash, address, created_at) VALUES (@id, @name, @email, @password_hash, @address, @created_at)'
);
const insertProducts = enc.prepare(
  'INSERT OR IGNORE INTO products (id, name, description, price, image_url, category, stock, rating, review_count) VALUES (@id, @name, @description, @price, @image_url, @category, @stock, @rating, @review_count)'
);
const insertCartItems = enc.prepare(
  'INSERT OR IGNORE INTO cart_items (id, user_id, product_id, quantity) VALUES (@id, @user_id, @product_id, @quantity)'
);
const insertOrders = enc.prepare(
  'INSERT OR IGNORE INTO orders (id, user_id, total, status, shipping_address, created_at) VALUES (@id, @user_id, @total, @status, @shipping_address, @created_at)'
);
const insertOrderItems = enc.prepare(
  'INSERT OR IGNORE INTO order_items (id, order_id, product_id, name, quantity, price) VALUES (@id, @order_id, @product_id, @name, @quantity, @price)'
);

enc.transaction(() => {
  data.users.forEach(r => insertUsers.run(r));
  data.products.forEach(r => insertProducts.run(r));
  data.cart_items.forEach(r => insertCartItems.run(r));
  data.orders.forEach(r => insertOrders.run(r));
  data.order_items.forEach(r => insertOrderItems.run(r));
})();

enc.close();

console.log('\nMigration complete. Database is now encrypted.');
console.log(`If everything looks good, you can delete the backup: ${BACKUP_PATH}`);
