const fileMtime = require('./file-mtime');
const dbCurrency = require('./db-currency');
const { tcp, icmp } = require('./ping');
const datedFileExists = require('./dated-file-exists');

const HANDLERS = {
  file_mtime: fileMtime,
  db_currency: dbCurrency,
  tcp,
  icmp,
  dated_file_exists: datedFileExists,
};

async function runCheck(check) {
  const handler = HANDLERS[check.type];
  if (!handler) throw new Error(`Unknown check type: "${check.type}"`);
  return handler(check);
}

module.exports = { runCheck };
