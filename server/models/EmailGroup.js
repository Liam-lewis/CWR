const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailGroup = sequelize.define('EmailGroup', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  emails: {
    type: DataTypes.STRING, // Comma-separated list
    allowNull: false
  }
});

module.exports = EmailGroup;
