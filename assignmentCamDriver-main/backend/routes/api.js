const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Event = require('../models/Event');

// Helper function defined at the top so it's available everywhere
async function getCurrentStats() {
  const totalTrips = await Trip.count();
  const liveDrivers = await Trip.count({ where: { status: 'active' } });
  const violationCount = await Event.count();
  const activeTrips = await Trip.findAll({ where: { status: 'active' } });
  let totalRisk = 0;
  activeTrips.forEach(t => totalRisk += t.riskScore);
  const avgRiskScore = activeTrips.length ? Math.round(totalRisk / activeTrips.length) : 0;
  return { totalTrips, liveDrivers, violationCount, avgRiskScore };
}

// GET /api/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await getCurrentStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/recent
router.get('/events/recent', async (req, res) => {
  try {
    const events = await Event.findAll({
      limit: 10,
      order: [['timestamp', 'DESC']],
      include: [{ model: Trip, attributes: ['driverName'] }]
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
router.post('/events', async (req, res) => {
  try {
    const { tripId, type, speed, details } = req.body;

    // Find or create a trip
    let trip;
    if (!tripId) {
      trip = await Trip.create({ driverName: 'Simulated Driver' });
    } else {
      trip = await Trip.findByPk(tripId);
      if (!trip) return res.status(404).json({ error: 'Trip not found' });
    }

    const event = await Event.create({
      tripId: trip.id,
      type,
      speed,
      details,
      timestamp: new Date()
    });

    // Update trip stats
    trip.violationCount += 1;
    let riskIncrease = 5;
    if (type === 'speeding' && speed > 80) {
      riskIncrease += 10;
    }
    trip.riskScore += riskIncrease;
    await trip.save();

    // Emit via WebSocket
    const io = req.app.get('io');
    io.emit('new-event', event);
    io.emit('stats-update', await getCurrentStats());

    res.status(201).json(event);
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;