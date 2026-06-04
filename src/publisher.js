const mqtt = require('mqtt');

function createPublisher(config) {
  const { projectId, systemId, mqtt: mqttConfig } = config;
  let client = null;

  const checkTopic = (checkId) => `${projectId}/${systemId}/checks/${checkId}`;
  const heartbeatTopic = () => `${projectId}/${systemId}/heartbeat`;

  function connect() {
    return new Promise((resolve, reject) => {
      const url = `mqtt://${mqttConfig.host}:${mqttConfig.port}`;
      client = mqtt.connect(url, {
        clean: true,
        reconnectPeriod: 10_000,
        username: mqttConfig.username,
        password: mqttConfig.password,
      });

      client.once('connect', resolve);
      client.once('error', reject);

      client.on('error', (err) => console.error('[MQTT] Error:', err.message));
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
  };
}

module.exports = { createPublisher };
