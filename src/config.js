const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

function ensureUUIDs() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (process.env.PROJECT_ID && process.env.SYSTEM_ID) return;

  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  if (!process.env.PROJECT_ID) {
    const id = uuidv4();
    process.env.PROJECT_ID = id;
    content = content.match(/^PROJECT_ID=/m)
      ? content.replace(/^PROJECT_ID=.*/m, `PROJECT_ID=${id}`)
      : content + `\nPROJECT_ID=${id}`;
    console.log(`[CONFIG] Generated PROJECT_ID: ${id}`);
  }

  if (!process.env.SYSTEM_ID) {
    const id = uuidv4();
    process.env.SYSTEM_ID = id;
    content = content.match(/^SYSTEM_ID=/m)
      ? content.replace(/^SYSTEM_ID=.*/m, `SYSTEM_ID=${id}`)
      : content + `\nSYSTEM_ID=${id}`;
    console.log(`[CONFIG] Generated SYSTEM_ID: ${id}`);
  }

  fs.writeFileSync(envPath, content);
}

function loadConfig() {
  ensureUUIDs();

  const checksPath = path.resolve(process.cwd(), 'checks.json');
  if (!fs.existsSync(checksPath)) {
    throw new Error('checks.json not found — copy checks.example.json to checks.json and configure it');
  }

  const { checks, connectionTests = [] } = JSON.parse(fs.readFileSync(checksPath, 'utf8'));
  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error('checks.json must contain a non-empty "checks" array');
  }
  if (!Array.isArray(connectionTests)) {
    throw new Error('checks.json "connectionTests" must be an array');
  }

  const seenIds = new Set();
  const validateCheck = (check) => {
    if (!check.id) throw new Error(`Check missing required field "id": ${JSON.stringify(check)}`);
    if (!check.type) throw new Error(`Check "${check.id}" missing required field "type"`);
    if (!Number.isInteger(check.refreshMinutes) || check.refreshMinutes < 1) throw new Error(`Check "${check.id}" must have a "refreshMinutes" field set to a whole number >= 1`);
    if (seenIds.has(check.id)) throw new Error(`Duplicate check id "${check.id}" — each check must have a unique id`);
    seenIds.add(check.id);
  };

  for (const check of checks) validateCheck(check);

  for (const test of connectionTests) {
    validateCheck(test);
    if (!test.subjectId) throw new Error(`Connection test "${test.id}" missing required field "subjectId"`);
    if (!test.subjectLabel) throw new Error(`Connection test "${test.id}" missing required field "subjectLabel"`);
    if (!test.config?.host) throw new Error(`Connection test "${test.id}" missing required field "config.host"`);
  }

  return {
    projectId: process.env.PROJECT_ID,
    systemId: process.env.SYSTEM_ID,
    locationLabel: process.env.LOCATION_LABEL || process.env.SYSTEM_ID,
    mqtt: {
      host: process.env.MQTT_HOST || 'localhost',
      port: parseInt(process.env.MQTT_PORT || '1883', 10),
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
    },
    heartbeatCron: process.env.HEARTBEAT_CRON || '*/1 * * * *',
    historyDbPath: process.env.HISTORY_DB_PATH || 'data/history.db',
    connectionTests,
    checks,
  };
}

module.exports = { loadConfig };
