// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASS,
//   {
//     host: process.env.DB_HOST,
//     dialect: 'mysql', // or 'postgres'
//     logging: false,   // Clean console
//   }
// );

// module.exports = sequelize;

const Sequelize = require('sequelize');
const config = require('./config'); // Imports the config object we set up earlier
require('dotenv').config();

// Determine the environment (development, test, or production)
const env = process.env.NODE_ENV || 'development';

// Select the config for the current environment
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false, // Set to console.log to see raw SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // If you are using timezone (important for event scheduling)
    timezone: '+05:30', // Example for IST (adjust as needed)
  }
);

// Test the connection immediately (Optional but good for debugging)
sequelize
  .authenticate()
  .then(() => {
    console.log(`✅ [${env}] Database connection established successfully.`);
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
  });

module.exports = sequelize;