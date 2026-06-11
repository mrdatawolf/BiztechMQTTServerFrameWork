const mqtt = require('mqtt');

function createPublisher(config) {
  const { projectId, systemId, mqtt: mqttConfig } = config;
  let client = null;

  const checkTopic = (checkId) => `${projectId}/${systemId}/checks/${checkId}`;
  const heartbeatTopic = () => `${projectId}/${systemId}/heartbeat`;
  const connectionTopic = (subjectId, checkId) => `connections/${subjectId}/${projectId}/${systemId}/${checkId}`;

  function connect() {
    return new Promise((resolve, reject) => {
      const url = `mqtt://${mqttConfig.host}:${mqttConfig.port}`;
      console.log(`[MQTT] Connecting to ${url}...`);
      
      client = mqtt.connect(url, {
        clean: true,
        reconnectPeriod: 10_000,
        username: mqttConfig.username,
        password: mqttConfig.password,
      });

      const timeout = setTimeout(() => {
        client.end(true);
        reject(new Error(`Connection timeout after 30s — broker at ${mqttConfig.host}:${mqttConfig.port} is unreachable`));
      }, 30_000);

      client.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      client.once('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`MQTT connection failed: ${err.message || err.toString()}`));
      });

      client.on('error', (err) => console.error('[MQTT] Error:', err.message || err.toString()));
      client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
      client.on('connect', () => console.log('[MQTT] Connected'));
      client.on('offline', () => console.log('[MQTT] Offline'));
    });
  }

  function publish(topic, payload) {
    if (!client?.connected) {
      console.warn(`[MQTT] Not connected — skipping publish to ${topic}`);
      return;
    }
    client.publish(topic, JSON.stringify(payload), { qos: 1, retain: true });
  }

  return {
    connect,
    publishCheck: (checkId, result) => publish(checkTopic(checkId), result),
    publishHeartbeat: (payload) => publish(heartbeatTopic(), payload),
    publishConnectionTest: (subjectId, checkId, payload) => publish(connectionTopic(subjectId, checkId), payload),
  };
}

module.exports = { createPublisher };
