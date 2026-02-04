module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Registrations', 'paymentStatus', {
      type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending'
    });
    await queryInterface.addColumn('Registrations', 'paymentOrderId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Registrations', 'paymentId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Registrations', 'amountPaid', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns in reverse order
    await queryInterface.removeColumn('Registrations', 'amountPaid');
    await queryInterface.removeColumn('Registrations', 'paymentId');
    await queryInterface.removeColumn('Registrations', 'paymentOrderId');
    await queryInterface.removeColumn('Registrations', 'paymentStatus');
  }
};