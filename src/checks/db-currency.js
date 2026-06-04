const Database = require('better-sqlite3');

async function querySqlite(config) {
  const db = new Database(config.path, { readonly: true, fileMustExist: true });
  try {
    const row = db.prepare(`SELECT MAX("${config.column}") AS latest FROM "${config.table}"`).get();
    return row?.latest ?? null;
  } finally {
    db.close();
  }
}

async function queryPglite(config) {
  // PGlite stores its data in a directory (not a single file).
  // The path should point to a PGlite data directory created by @electric-sql/pglite.
  const { PGlite } = require('@electric-sql/pglite');
  const db = new PGlite(config.path);
  try {
    const result = await db.query(
      `SELECT MAX("${config.column}") AS latest FROM "${config.table}"`
    );
    return result.rows[0]?.latest ?? null;
  } finally {
    await db.close();
  }
}

async function dbCurrency(check) {
  const { id, label, config } = check;
  const { dbType = 'sqlite' } = config;
  const checkedAt = new Date().toISOString();

  let latestRecord = null;
  let ageSeconds = null;
  let error = null;

  try {
    if (dbType === 'sqlite') {
      latestRecord = await querySqlite(config);
    } else if (dbType === 'pglite') {
      latestRecord = await queryPglite(config);
    } else {
      throw new Error(`Unknown dbType: "${dbType}"`);
    }

    if (latestRecord !== null) {
      ageSeconds = Math.floor((Date.now() - new Date(latestRecord).getTime()) / 1000);
    }
  } catch (err) {
    error = err.message;
  }

  return {
    type: 'db_currency',
    id,
    label,
    dbType,
    table: config.table,
    column: config.column,
    latestRecord,
    ageSeconds,
    error,
    checkedAt,
  };
}

module.exports = dbCurrency;
