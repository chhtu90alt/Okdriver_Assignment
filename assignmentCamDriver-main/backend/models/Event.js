const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Trip = require('./Trip');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tripId: {
    type: DataTypes.INTEGER,
    references: {
      model: Trip,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('speeding', 'harsh_braking', 'drowsiness'),
    allowNull: false
  },
  speed: {
    type: DataTypes.FLOAT,
    comment: 'Speed in km/h (for speeding events)'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  details: {
    type: DataTypes.TEXT
  }
});

Event.belongsTo(Trip, { foreignKey: 'tripId' });
Trip.hasMany(Event, { foreignKey: 'tripId' });

module.exports = Event;