const ROLLING_WINDOW = 10;
const STREAK_LOOKBACK = 1440; // ~24h at a 1-minute refresh rate
const TRANSITIONS_WINDOW_MS = 60 * 60 * 1000;

// Derives stability metrics for a connection-style check (icmp/tcp) from its
// stored history, so consumers can tell "flapping" apart from "hard down"
// without re-deriving it from raw history themselves.
function computeStats(store, checkId, now = Date.now()) {
  const recent = store.getRecentResults(checkId, STREAK_LOOKBACK);

  const lossValues = recent
    .slice(0, ROLLING_WINDOW)
    .map((r) => r.packetLoss)
    .filter((v) => typeof v === 'number');
  const rollingPacketLoss10 = lossValues.length
    ? Math.round((lossValues.reduce((sum, v) => sum + v, 0) / lossValues.length) * 100) / 100
    : null;

  let consecutiveFailures = 0;
  let consecutiveSuccesses = 0;
  for (const r of recent) {
    if (r.available) {
      if (consecutiveFailures > 0) break;
      consecutiveSuccesses++;
    } else {
      if (consecutiveSuccesses > 0) break;
      consecutiveFailures++;
    }
  }

  const since = new Date(now - TRANSITIONS_WINDOW_MS).toISOString();
  const recentHour = store.getResultsSince(checkId, since);
  let transitions1h = 0;
  for (let i = 1; i < recentHour.length; i++) {
    if (recentHour[i].available !== recentHour[i - 1].available) transitions1h++;
  }

  return { rollingPacketLoss10, consecutiveFailures, consecutiveSuccesses, transitions1h };
}

module.exports = { computeStats };
