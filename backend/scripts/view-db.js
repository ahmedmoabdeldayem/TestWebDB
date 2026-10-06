#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../database/shop.sqlite');
const db = new Database(DB_PATH);
db.pragma("cipher='sqlcipher'");
db.pragma(`key='${process.env.DB_ENCRYPTION_KEY}'`);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);

const arg = process.argv[2];

if (!arg || arg === 'tables') {
  console.log('Tables:', tables.join(', '));
  console.log('\nUsage: node view-db.js <table>');
  console.log('       node view-db.js <table> <limit>');
} else if (tables.includes(arg)) {
  const limit = parseInt(process.argv[3]) || 50;
  const rows = db.prepare(`SELECT * FROM ${arg} LIMIT ?`).all(limit);
  if (rows.length === 0) {
    console.log(`(no rows in ${arg})`);
  } else {
    console.log(`\n=== ${arg} (${rows.length} rows) ===`);
    console.table(rows);
  }
} else {
  console.error(`Unknown table "${arg}". Available: ${tables.join(', ')}`);
}

db.close();
