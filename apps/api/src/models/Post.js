const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  siteId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  coverImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft',
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  seoTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  seoDescription: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ogImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  readingTimeMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Post;
