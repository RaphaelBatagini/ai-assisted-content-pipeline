'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('social_links', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      site_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'sites', key: 'id' },
        onDelete: 'CASCADE',
      },
      platform: {
        type: Sequelize.ENUM(
          'instagram',
          'facebook',
          'twitter',
          'linkedin',
          'youtube',
          'tiktok',
          'pinterest',
          'other'
        ),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('social_links');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_social_links_platform";');
  },
};
