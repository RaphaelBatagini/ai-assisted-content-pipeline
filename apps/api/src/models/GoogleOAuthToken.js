const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoogleOAuthToken = sequelize.define(
  'GoogleOAuthToken',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    // AES-256-GCM encrypted, format: iv:ciphertext:authtag (hex)
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // AES-256-GCM encrypted
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    googleEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    scopes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'google_oauth_tokens',
  }
);

module.exports = GoogleOAuthToken;
