const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  driverName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Simulated Driver'
  },
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('active', 'completed'),
    defaultValue: 'active'
  },
  violationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  riskScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Trip;