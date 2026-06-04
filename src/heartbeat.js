const cron = require('node-cron');

function createHeartbeat(publisher, config) {
  const serverStarted = new Date().toISOString();

  function beat() {
    publisher.publishHeartbeat({
      projectId: config.projectId,
      systemId: config.systemId,
      serverStarted,
      checks: config.checks.map(({ id, type, label, schedule }) => ({ id, type, label, schedule })),
      publishedAt: new Date().toISOString(),
    });
  }

  return {
    start() {
      beat();
      cron.schedule(config.heartbeatCron, beat);
    },
  };
}

module.exports = { createHeartbeat };
