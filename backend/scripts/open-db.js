#!/usr/bin/env node
/**
 * Temporarily decrypts the database to a plain SQLite file,
 * opens it in DB Browser for SQLite, then deletes it on exit.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Database = require('better-sqlite3-multiple-ciphers');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '../../database/shop.sqlite');
const TEMP_PATH = path.resolve(__dirname, '../../database/shop_temp_view.sqlite');

const encryptionKey = process.env.DB_ENCRYPTION_KEY;
if (!encryptionKey) { console.error('DB_ENCRYPTION_KEY not set'); process.exit(1); }

// Export encrypted -> plain
console.log('Decrypting database for viewing...');
const enc = new Database(DB_PATH);
enc.pragma("cipher='sqlcipher'");
enc.pragma(`key='${encryptionKey}'`);

const plain = new Database(TEMP_PATH);
const tables = enc.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
for (const { name, sql } of tables) {
  plain.exec(sql);
  const rows = enc.prepare(`SELECT * FROM ${name}`).all();
  if (rows.length === 0) continue;
  const cols = Object.keys(rows[0]);
  const insert = plain.prepare(`INSERT INTO ${name} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
  plain.transaction(rs => rs.forEach(r => insert.run(Object.values(r))))(rows);
}
enc.close();
plain.close();

console.log('Opening DB Browser... Close it when done to delete the temp file.');

// Open DB Browser and wait for it to close
const proc = spawn('open', ['-W', '-a', 'DB Browser for SQLite', TEMP_PATH]);
proc.on('close', () => {
  fs.unlinkSync(TEMP_PATH);
  console.log('Temp file deleted.');
});
