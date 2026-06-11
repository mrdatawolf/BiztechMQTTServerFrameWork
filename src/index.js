const { loadConfig } = require('./config');
const { createPublisher } = require('./publisher');
const { createStore } = require('./store');
const { createHeartbeat } = require('./heartbeat');
const { createScheduler } = require('./scheduler');
const { runCheck } = require('./checks');
const { computeStats } = require('./connectionStats');

async function main() {
  const config = loadConfig();
  const store = createStore(config.historyDbPath);
  const publisher = createPublisher(config);

  await publisher.connect();

  createHeartbeat(publisher, config).start();

  async function processCheck(check, isConnectionTest = false) {
    const result = await runCheck(check);
    store.record(check.id, result);

    let payload = { ...result, refreshMinutes: check.refreshMinutes };
    if (typeof result.available === 'boolean') {
      payload = { ...payload, ...computeStats(store, check.id) };
    }

    if (isConnectionTest) {
      // Connection tests are only published as connection tests
      publisher.publishConnectionTest(check.subjectId, check.id, {
        ...payload,
        subjectId: check.subjectId,
        subjectLabel: check.subjectLabel,
        host: check.config.host,
        projectId: config.projectId,
        systemId: config.systemId,
        locationLabel: config.locationLabel,
      });
    } else {
      // Regular checks are published as checks
      publisher.publishCheck(check.id, payload);
    }

    console.log(`[CHECK] ${check.id}: ${JSON.stringify(payload)}`);
  }

  createScheduler(config.checks, (check) => processCheck(check, false)).start();
  if (config.connectionTests.length) {
    createScheduler(config.connectionTests, (check) => processCheck(check, true)).start();
  }

  console.log('─'.repeat(60));
  console.log('[FRAMEWORK] Running');
  console.log(`  Project : ${config.projectId}`);
  console.log(`  System  : ${config.systemId}`);
  console.log(`  Broker  : mqtt://${config.mqtt.host}:${config.mqtt.port}`);
  console.log(`  Checks  : ${config.checks.map(c => c.id).join(', ')}`);
  if (config.connectionTests.length) {
    console.log(`  Connections : ${config.connectionTests.map(c => `${c.id} -> ${c.subjectId}`).join(', ')}`);
  }
  console.log('─'.repeat(60));
}

main().catch((err) => {
  console.error('[FATAL]', err.message || err.toString());
  if (err.stack && process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});
