const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PostCategory = sequelize.define('PostCategory', {
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
  },
}, {
  timestamps: false,
});

module.exports = PostCategory;
