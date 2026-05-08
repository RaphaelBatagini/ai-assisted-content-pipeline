'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sites', 'google_provisioning_status', {
      type: Sequelize.ENUM('idle', 'pending', 'provisioning', 'ready', 'error'),
      allowNull: false,
      defaultValue: 'idle',
    });
    await queryInterface.addColumn('sites', 'google_provisioning_error', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('sites', 'ga_stream_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('sites', 'gtm_numeric_container_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('sites', 'gtm_workspace_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('sites', 'gtm_workspace_id');
    await queryInterface.removeColumn('sites', 'gtm_numeric_container_id');
    await queryInterface.removeColumn('sites', 'ga_stream_id');
    await queryInterface.removeColumn('sites', 'google_provisioning_error');
    await queryInterface.removeColumn('sites', 'google_provisioning_status');
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_sites_google_provisioning_status;"
    );
  },
};
