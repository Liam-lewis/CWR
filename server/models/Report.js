const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  referenceNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  time: {
    type: DataTypes.STRING
  },
  date: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  evidence: {
    type: DataTypes.JSON // Stores array of filenames
  },
  forwardHistory: {
    type: DataTypes.JSON, // Stores array of { to: string, sentAt: string }
    defaultValue: []
  }
});

module.exports = Report;
