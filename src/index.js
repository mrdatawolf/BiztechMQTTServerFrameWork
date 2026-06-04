const { loadConfig } = require('./config');
const { createPublisher } = require('./publisher');
const { createStore } = require('./store');
const { createHeartbeat } = require('./heartbeat');
const { createScheduler } = require('./scheduler');
const { runCheck } = require('./checks');

async function main() {
  const config = loadConfig();
  const store = createStore(config.historyDbPath);
  const publisher = createPublisher(config);

  await publisher.connect();

  createHeartbeat(publisher, config).start();

  createScheduler(config.checks, async (check) => {
    const result = await runCheck(check);
    store.record(check.id, result);
    publisher.publishCheck(check.id, { ...result, refreshMinutes: check.refreshMinutes });
    console.log(`[CHECK] ${check.id}: ${JSON.stringify(result)}`);
  }).start();

  console.log('─'.repeat(60));
  console.log('[FRAMEWORK] Running');
  console.log(`  Project : ${config.projectId}`);
  console.log(`  System  : ${config.systemId}`);
  console.log(`  Broker  : mqtt://${config.mqtt.host}:${config.mqtt.port}`);
  console.log(`  Checks  : ${config.checks.map(c => c.id).join(', ')}`);
  console.log('─'.repeat(60));
}

main().catch((err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
