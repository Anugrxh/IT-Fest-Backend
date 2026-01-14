const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Registration = sequelize.define("Registration", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "approved",
  },
  teamName: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Registration;
