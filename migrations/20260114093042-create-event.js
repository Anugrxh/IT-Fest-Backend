'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Events', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      title: { type: Sequelize.STRING, allowNull: false },
      venue: { type: Sequelize.STRING },
      dateTime: { type: Sequelize.DATE },
      
      // Foreign Key: Category
      categoryId: {
        type: Sequelize.UUID,
        references: {
          model: 'Categories', // Name of the TABLE (plural)
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      isTeamEvent: { type: Sequelize.BOOLEAN, defaultValue: false },
      minTeamSize: { type: Sequelize.INTEGER, defaultValue: 1 },
      maxTeamSize: { type: Sequelize.INTEGER, defaultValue: 1 },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Events');
  }
};