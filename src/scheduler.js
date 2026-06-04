const cron = require('node-cron');

function createScheduler(checks, onCheck) {
  return {
    start() {
      for (const check of checks) {
        const run = () =>
          onCheck(check).catch((err) =>
            console.error(`[CHECK:${check.id}] Unhandled error: ${err.message}`)
          );

        const cronExpr = `*/${check.refreshMinutes} * * * *`;
        run();
        cron.schedule(cronExpr, run);
        console.log(`[SCHEDULER] "${check.id}" (${check.type}) every ${check.refreshMinutes} min`);
      }
    },
  };
}

module.exports = { createScheduler };
