'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Registrations Table
    await queryInterface.createTable('Registrations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      status: { 
        type: Sequelize.ENUM('pending', 'approved', 'rejected'), 
        defaultValue: 'approved' 
      },
      teamName: { type: Sequelize.STRING },
      
      // FK: Event
      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Events', key: 'id' }
      },
      // FK: User (Leader)
      leaderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    // 2. Create Junction Table (RegistrationMembers)
    // This links Users to Registrations for team members
    await queryInterface.createTable('RegistrationMembers', {
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      
      RegistrationId: {
        type: Sequelize.UUID,
        primaryKey: true, // Composite PK
        references: { model: 'Registrations', key: 'id' },
        onDelete: 'CASCADE'
      },
      UserId: {
        type: Sequelize.UUID,
        primaryKey: true, // Composite PK
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RegistrationMembers');
    await queryInterface.dropTable('Registrations');
  }
};