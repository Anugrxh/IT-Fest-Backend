const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Category = require('./Category'); // Import the new model
const Registration = require('./Registration');

// --- 1. Category <-> Event ---
// One Category has many Events
Category.hasMany(Event, { foreignKey: 'categoryId', as: 'events' });
// An Event belongs to one Category
Event.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// --- 2. User <-> Registration ---
User.hasMany(Registration, { foreignKey: 'leaderId' });
Registration.belongsTo(User, { as: 'Leader', foreignKey: 'leaderId' });

// --- 3. Event <-> Registration ---
Event.hasMany(Registration, { foreignKey: 'eventId' });
Registration.belongsTo(Event, { foreignKey: 'eventId' });

// --- 4. Team Members ---
Registration.belongsToMany(User, { through: 'RegistrationMembers', as: 'Members' });
User.belongsToMany(Registration, { through: 'RegistrationMembers', as: 'TeamRegistrations' });

const db = { sequelize, User, Event, Category, Registration };
module.exports = db;