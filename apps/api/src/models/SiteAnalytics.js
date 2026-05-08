const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteAnalytics = sequelize.define(
  'SiteAnalytics',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    siteId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    sessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    users: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    newUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    avgSessionDurationSeconds: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    bounceRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    organicSessions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'site_analytics',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['site_id', 'date'] }],
  },
);

module.exports = SiteAnalytics;
