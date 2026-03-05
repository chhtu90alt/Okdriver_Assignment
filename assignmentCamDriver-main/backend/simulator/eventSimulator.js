const axios = require('axios');

const API_URL = 'http://localhost:5000/api/events';

const eventTypes = ['speeding', 'harsh_braking', 'drowsiness'];

async function simulateEvent() {
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  let speed = null;
  if (type === 'speeding') {
    speed = Math.floor(Math.random() * 50) + 60; // 60-110 km/h
  }

  const payload = {
    type,
    speed,
    details: `${type} event detected`
  };

  try {
    const response = await axios.post(API_URL, payload);
    console.log('✅ Event simulated:', response.data);
  } catch (err) {
    console.error('❌ Simulation error:', err.message);
  }
}

function startSimulation(intervalMs = 3000) {
  setInterval(simulateEvent, intervalMs);
}

module.exports = { startSimulation };