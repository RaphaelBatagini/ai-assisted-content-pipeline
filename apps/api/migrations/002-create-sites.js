'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sites', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      color_palette: {
        type: Sequelize.ENUM(
          'ocean_breeze',
          'forest_green',
          'sunset_orange',
          'midnight_blue',
          'rose_gold',
          'slate_gray',
          'lavender_mist',
          'warm_sand'
        ),
        allowNull: false,
      },
      logo_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      favicon_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      whatsapp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ga_tracking_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gtm_container_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fb_pixel_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      custom_head_scripts: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('sites', ['slug'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sites');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sites_color_palette";');
  },
};
