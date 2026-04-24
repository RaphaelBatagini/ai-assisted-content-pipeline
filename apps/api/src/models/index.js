const sequelize = require('../config/database');

const User = require('./User');
const Site = require('./Site');
const SocialLink = require('./SocialLink');
const Category = require('./Category');
const Post = require('./Post');
const PostCategory = require('./PostCategory');
const ContactMessage = require('./ContactMessage');

// Associations
User.hasMany(Site, { foreignKey: 'userId', onDelete: 'CASCADE' });
Site.belongsTo(User, { foreignKey: 'userId' });

Site.hasMany(SocialLink, { foreignKey: 'siteId', onDelete: 'CASCADE' });
SocialLink.belongsTo(Site, { foreignKey: 'siteId' });

Site.hasMany(Category, { foreignKey: 'siteId', onDelete: 'CASCADE' });
Category.belongsTo(Site, { foreignKey: 'siteId' });

Site.hasMany(Post, { foreignKey: 'siteId', onDelete: 'CASCADE' });
Post.belongsTo(Site, { foreignKey: 'siteId' });

User.hasMany(Post, { foreignKey: 'authorId' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Post.belongsToMany(Category, { through: PostCategory, foreignKey: 'postId' });
Category.belongsToMany(Post, { through: PostCategory, foreignKey: 'categoryId' });

Site.hasMany(ContactMessage, { foreignKey: 'siteId', onDelete: 'CASCADE' });
ContactMessage.belongsTo(Site, { foreignKey: 'siteId' });

module.exports = {
  sequelize,
  User,
  Site,
  SocialLink,
  Category,
  Post,
  PostCategory,
  ContactMessage,
};
