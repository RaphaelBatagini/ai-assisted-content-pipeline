'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // analytics_events: one row per tracked interaction (e.g. CTA click)
    await queryInterface.createTable('analytics_events', {
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
      post_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'posts', key: 'id' },
        onDelete: 'SET NULL',
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('analytics_events', ['site_id']);
    await queryInterface.addIndex('analytics_events', ['post_id']);
    await queryInterface.addIndex('analytics_events', ['event_type']);
    await queryInterface.addIndex('analytics_events', ['created_at']);

    // post_analytics: daily GA4 snapshot per post
    await queryInterface.createTable('post_analytics', {
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
      post_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'posts', key: 'id' },
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      pageviews: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sessions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      avg_session_duration_seconds: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      bounce_rate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('post_analytics', ['site_id']);
    await queryInterface.addIndex('post_analytics', ['post_id', 'date'], { unique: true });

    // site_analytics: daily GA4 snapshot for the whole site
    await queryInterface.createTable('site_analytics', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      sessions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      users: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      new_users: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      avg_session_duration_seconds: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      bounce_rate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      organic_sessions: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('site_analytics', ['site_id', 'date'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('site_analytics');
    await queryInterface.dropTable('post_analytics');
    await queryInterface.dropTable('analytics_events');
  },
};
