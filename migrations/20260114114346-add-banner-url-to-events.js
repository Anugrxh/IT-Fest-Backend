module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Events', 'bannerUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Events', 'bannerUrl');
  }
};