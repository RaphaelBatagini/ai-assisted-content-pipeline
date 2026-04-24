const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Site = sequelize.define('Site', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  colorPalette: {
    type: DataTypes.ENUM(
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
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  faviconUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  whatsapp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  gaTrackingId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gtmContainerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fbPixelId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customHeadScripts: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Site;
