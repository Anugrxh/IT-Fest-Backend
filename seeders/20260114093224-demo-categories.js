'use strict';
const { v4: uuidv4 } = require('uuid'); 

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      {
        id: uuidv4(),
        name: 'Technical',
        slug: 'technical',
        description: 'Coding, Hardware, and Logic',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Cultural',
        slug: 'cultural',
        description: 'Dance, Music, and Art',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};