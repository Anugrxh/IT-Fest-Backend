const Sequelize = require('sequelize');
const config = require('./config'); 
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: false, 
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+05:30', 
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log(`✅ [${env}] Database connection established successfully.`);
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
  });

module.exports = sequelize;