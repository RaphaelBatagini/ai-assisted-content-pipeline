const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostAnalytics = sequelize.define(
  'PostAnalytics',
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
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pageviews: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sessions: {
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
  },
  {
    tableName: 'post_analytics',
    underscored: true,
    timestamps: false,
    indexes: [{ unique: true, fields: ['post_id', 'date'] }],
  },
);

module.exports = PostAnalytics;
