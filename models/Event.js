const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  
  // REMOVED: category: { type: DataTypes.ENUM(...)... } 
  // We will handle the link in index.js relations
  
  venue: { type: DataTypes.STRING },
  dateTime: { type: DataTypes.DATE, required: true },
  
  isTeamEvent: { type: DataTypes.BOOLEAN, defaultValue: false },
  minTeamSize: { type: DataTypes.INTEGER, defaultValue: 1 },
  maxTeamSize: { type: DataTypes.INTEGER, defaultValue: 1 },
  
  registrationFee: { type: DataTypes.INTEGER, defaultValue: 0 },
  capacity: { type: DataTypes.INTEGER },
  bannerUrl: { type: DataTypes.STRING }
});

module.exports = Event;