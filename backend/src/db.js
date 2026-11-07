/* Database: live pe MySQL (mysql2), apne computer pe chaho toh SQLite (Node 22.5+ ka built-in node:sqlite)
   Dono ke liye ek hi tareeka:  db.get(sql, params)  db.all(sql, params)  db.run(sql, params)  db.tx(async (t) => {...}) */
const fs = require('fs');
const path = require('path');
const { env, STORAGE_DIR, ROOT } = require('./config');

let impl = null;
let ready = null;

function schema(driver) {
  const id = driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
  const fk = driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
  const tail = driver === 'sqlite' ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
  return [
    `CREATE TABLE IF NOT EXISTS users (
      id ${id},
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      phone VARCHAR(20) NOT NULL DEFAULT '',
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL
    )${tail}`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id ${id},
      user_id ${fk} NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )${tail}`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id ${id},
      user_id ${fk} NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )${tail}`,
    `CREATE TABLE IF NOT EXISTS login_attempts (
      id ${id},
      attempt_key VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL
    )${tail}`,
    `CREATE TABLE IF NOT EXISTS orders (
      id ${id},
      order_no VARCHAR(32) NOT NULL UNIQUE,
      user_id ${fk} NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      subtotal INT NOT NULL,
      shipping INT NOT NULL,
      discount INT NOT NULL DEFAULT 0,
      total INT NOT NULL,
      item_count INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(190) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255) NOT NULL DEFAULT '',
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      pincode VARCHAR(6) NOT NULL,
      razorpay_order_id VARCHAR(64) UNIQUE,
      razorpay_payment_id VARCHAR(64),
      awb VARCHAR(40),
      shipment_error TEXT,
      emails_sent TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL,
      paid_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )${tail}`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id ${id},
      order_id ${fk} NOT NULL,
      product_id VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      size VARCHAR(40) NOT NULL DEFAULT '',
      img VARCHAR(500) NOT NULL DEFAULT '',
      price INT NOT NULL,
      qty INT NOT NULL,
      line_total INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )${tail}`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id ${id},
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(20) NOT NULL DEFAULT '',
      topic VARCHAR(60) NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at DATETIME NOT NULL
    )${tail}`,
  ];
}

// undefined ki jagah null (mysql2 undefined pe error deta hai)
const clean = (params) => (params || []).map((p) => (p === undefined ? null : typeof p === 'boolean' ? Number(p) : p));

function mysqlImpl() {
  const mysql = require('mysql2/promise');
  const pool = mysql.createPool({
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT', 3306)),
    user: env('DB_USER'),
    password: env('DB_PASS'),
    database: env('DB_NAME'),
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    charset: 'utf8mb4',
  });
  const wrapConn = (c) => ({
    async all(sql, p) { const [rows] = await c.execute(sql, clean(p)); return rows; },
    async get(sql, p) { const [rows] = await c.execute(sql, clean(p)); return rows[0] || null; },
    async run(sql, p) { const [r] = await c.execute(sql, clean(p)); return { insertId: r.insertId, changes: r.affectedRows }; },
    async exec(sql) { await c.query(sql); },
  });
  const base = wrapConn(pool);
  return {
    ...base,
    async tx(fn) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const out = await fn(wrapConn(conn));
        await conn.commit();
        return out;
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    },
  };
}

function sqliteImpl() {
  const { DatabaseSync } = require('node:sqlite');
  let file = env('DB_SQLITE_PATH', path.join(STORAGE_DIR, 'rupur.sqlite'));
  if (!path.isAbsolute(file)) file = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const api = {
    async all(sql, p) { return db.prepare(sql).all(...clean(p)); },
    async get(sql, p) { return db.prepare(sql).get(...clean(p)) || null; },
    async run(sql, p) { const r = db.prepare(sql).run(...clean(p)); return { insertId: Number(r.lastInsertRowid), changes: Number(r.changes) }; },
    async exec(sql) { db.exec(sql); },
  };
  let queue = Promise.resolve();
  return {
    ...api,
    // SQLite ek connection hai, isliye transactions ek ke baad ek
    tx(fn) {
      const run = queue.then(async () => {
        db.exec('BEGIN');
        try { const out = await fn(api); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; }
      });
      queue = run.catch(() => {});
      return run;
    },
  };
}

async function init() {
  if (!ready) {
    ready = (async () => {
      const driver = env('DB_DRIVER', 'mysql');
      impl = driver === 'sqlite' ? sqliteImpl() : mysqlImpl();
      for (const sql of schema(driver)) await impl.exec(sql);
      // Purane database me naya column (discount) jodo – pehle se ho toh error ignore
      try { await impl.exec('ALTER TABLE orders ADD COLUMN discount INT NOT NULL DEFAULT 0'); } catch { /* column pehle se hai */ }
      return impl;
    })();
    ready.catch(() => { ready = null; }); // agli request pe dobara koshish
  }
  return ready;
}

module.exports = {
  init,
  all: async (sql, p) => (await init()).all(sql, p),
  get: async (sql, p) => (await init()).get(sql, p),
  run: async (sql, p) => (await init()).run(sql, p),
  tx: async (fn) => (await init()).tx(fn),
};
