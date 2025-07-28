'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'lastName', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'cedula', {
      type: Sequelize.STRING(20), 
      allowNull: true,
      unique: true, 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'lastName');
    await queryInterface.removeColumn('users', 'cedula');
  }
};