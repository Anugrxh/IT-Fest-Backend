const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true // Prevent duplicate categories like 'Technical'
  },
  description: { type: DataTypes.STRING }, // e.g. "Coding and Hardware events"
  slug: { type: DataTypes.STRING, unique: true }, // for frontend url: /events/technical
  
  // Optional: Global rule for this category
  defaultTeamSizeLimit: { type: DataTypes.INTEGER, defaultValue: 1 } 
}, {
  timestamps: false // We likely don't need created_at for categories
});

module.exports = Category;