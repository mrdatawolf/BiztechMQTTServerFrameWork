const fileMtime = require('./file-mtime');
const dbCurrency = require('./db-currency');
const { tcp, icmp } = require('./ping');

const HANDLERS = {
  file_mtime: fileMtime,
  db_currency: dbCurrency,
  tcp,
  icmp,
};

async function runCheck(check) {
  const handler = HANDLERS[check.type];
  if (!handler) throw new Error(`Unknown check type: "${check.type}"`);
  return handler(check);
}

module.exports = { runCheck };
