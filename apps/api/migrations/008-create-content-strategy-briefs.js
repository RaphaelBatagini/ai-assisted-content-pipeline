'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('content_strategy_briefs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      site_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'sites', key: 'id' },
        onDelete: 'CASCADE',
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      industry: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      target_audience: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      pain_points: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      differentiators: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      competitors: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      conversion_goal: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      content_goals: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content_formats: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tone_of_voice: {
        type: Sequelize.ENUM('professional', 'casual', 'technical', 'conversational'),
        allowNull: false,
        defaultValue: 'professional',
      },
      status: {
        type: Sequelize.ENUM('pending', 'researching', 'writing', 'ready', 'error'),
        allowNull: false,
        defaultValue: 'pending',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      roadmap_json: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      posts_generated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('content_strategy_briefs');
  },
};
