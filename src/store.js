const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function createStore(dbPath) {
  fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

  const db = new Database(dbPath);

  db.prepare(`
    CREATE TABLE IF NOT EXISTS check_results (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      checkId   TEXT NOT NULL,
      type      TEXT NOT NULL,
      payload   TEXT NOT NULL,
      checkedAt TEXT NOT NULL
    )
  `).run();

  const insert = db.prepare(
    'INSERT INTO check_results (checkId, type, payload, checkedAt) VALUES (?, ?, ?, ?)'
  );

  return {
    record(checkId, result) {
      insert.run(checkId, result.type, JSON.stringify(result), result.checkedAt);
    },
    getLatest(checkId) {
      const row = db.prepare(
        'SELECT payload FROM check_results WHERE checkId = ? ORDER BY id DESC LIMIT 1'
      ).get(checkId);
      return row ? JSON.parse(row.payload) : null;
    },
    getHistory(checkId, limit = 100) {
      return db.prepare(
        'SELECT payload FROM check_results WHERE checkId = ? ORDER BY id DESC LIMIT ?'
      ).all(checkId, Math.min(limit, 500)).map(r => JSON.parse(r.payload));
    },
    getRecentResults(checkId, limit) {
      return db.prepare(
        'SELECT payload FROM check_results WHERE checkId = ? ORDER BY id DESC LIMIT ?'
      ).all(checkId, limit).map(r => JSON.parse(r.payload));
    },
    getResultsSince(checkId, sinceISO) {
      return db.prepare(
        'SELECT payload FROM check_results WHERE checkId = ? AND checkedAt >= ? ORDER BY id ASC'
      ).all(checkId, sinceISO).map(r => JSON.parse(r.payload));
    },
  };
}

module.exports = { createStore };
