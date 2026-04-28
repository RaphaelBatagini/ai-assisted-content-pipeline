const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentStrategyBrief = sequelize.define('ContentStrategyBrief', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetAudience: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  painPoints: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  differentiators: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  competitors: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  conversionGoal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contentGoals: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  contentFormats: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  toneOfVoice: {
    type: DataTypes.ENUM('professional', 'casual', 'technical', 'conversational'),
    allowNull: false,
    defaultValue: 'professional',
  },
  status: {
    type: DataTypes.ENUM('pending', 'researching', 'writing', 'ready', 'error'),
    allowNull: false,
    defaultValue: 'pending',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  roadmapJson: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  postsGenerated: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

module.exports = ContentStrategyBrief;
