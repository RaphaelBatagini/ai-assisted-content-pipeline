const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialLink = sequelize.define('SocialLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  platform: {
    type: DataTypes.ENUM(
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
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
});

module.exports = SocialLink;
