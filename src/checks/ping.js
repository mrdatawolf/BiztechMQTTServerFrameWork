const net = require('net');

// TCP: no elevated privileges required.
function tcpPing(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ available: true, latencyMs, packetLoss: 0 });
    });

    const fail = () => {
      socket.destroy();
      resolve({ available: false, latencyMs: null, packetLoss: 100 });
    };

    socket.on('error', fail);
    socket.on('timeout', fail);
  });
}

// ICMP: requires CAP_NET_RAW or a setuid ping binary on Linux.
// If the 'ping' package cannot send ICMP packets it will throw; the check
// catches that and surfaces it in the error field.
async function icmpPing(host, count = 4) {
  const pingLib = require('ping');
  const res = await pingLib.promise.probe(host, { count, timeout: 5 });
  return {
    available: res.alive,
    latencyMs: res.alive ? parseFloat(res.avg) : null,
    packetLoss: parseFloat(res.packetLoss) || 0,
  };
}

async function tcp(check) {
  const { id, label, config } = check;
  const { host, port = 80, timeout = 5000 } = config;
  const checkedAt = new Date().toISOString();

  let available = false;
  let latencyMs = null;
  let packetLoss = null;
  let error = null;

  try {
    const result = await tcpPing(host, port, timeout);
    available = result.available;
    latencyMs = result.latencyMs;
    packetLoss = result.packetLoss;
  } catch (err) {
    error = err.message;
  }

  return { type: 'tcp', id, label, host, port, available, latencyMs, packetLoss, lastReceived: available ? checkedAt : null, error, checkedAt };
}

async function icmp(check) {
  const { id, label, config } = check;
  const { host, count = 4 } = config;
  const checkedAt = new Date().toISOString();

  let available = false;
  let latencyMs = null;
  let packetLoss = null;
  let error = null;

  try {
    const result = await icmpPing(host, count);
    available = result.available;
    latencyMs = result.latencyMs;
    packetLoss = result.packetLoss;
  } catch (err) {
    error = err.message;
  }

  return { type: 'icmp', id, label, host, available, latencyMs, packetLoss, lastReceived: available ? checkedAt : null, error, checkedAt };
}

module.exports = { tcp, icmp };
