const sequelize = require('../config/database');

const User = require('./User');
const Site = require('./Site');
const GoogleOAuthToken = require('./GoogleOAuthToken');
const SocialLink = require('./SocialLink');
const Category = require('./Category');
const Post = require('./Post');
const PostCategory = require('./PostCategory');
const ContactMessage = require('./ContactMessage');
const ContentStrategyBrief = require('./ContentStrategyBrief');
const AnalyticsEvent = require('./AnalyticsEvent');
const PostAnalytics = require('./PostAnalytics');
const SiteAnalytics = require('./SiteAnalytics');

// Associations
User.hasMany(Site, { foreignKey: 'userId', onDelete: 'CASCADE' });
Site.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(GoogleOAuthToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
GoogleOAuthToken.belongsTo(User, { foreignKey: 'userId' });

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

Site.hasOne(ContentStrategyBrief, { foreignKey: 'siteId', onDelete: 'CASCADE' });
ContentStrategyBrief.belongsTo(Site, { foreignKey: 'siteId' });

// Analytics associations
Site.hasMany(AnalyticsEvent, { foreignKey: 'siteId', onDelete: 'CASCADE' });
AnalyticsEvent.belongsTo(Site, { foreignKey: 'siteId' });

Post.hasMany(AnalyticsEvent, { foreignKey: 'postId', onDelete: 'SET NULL' });
AnalyticsEvent.belongsTo(Post, { foreignKey: 'postId' });

Site.hasMany(PostAnalytics, { foreignKey: 'siteId', onDelete: 'CASCADE' });
PostAnalytics.belongsTo(Site, { foreignKey: 'siteId' });

Post.hasMany(PostAnalytics, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostAnalytics.belongsTo(Post, { foreignKey: 'postId' });

Site.hasMany(SiteAnalytics, { foreignKey: 'siteId', onDelete: 'CASCADE' });
SiteAnalytics.belongsTo(Site, { foreignKey: 'siteId' });

module.exports = {
  sequelize,
  User,
  Site,
  GoogleOAuthToken,
  SocialLink,
  Category,
  Post,
  PostCategory,
  ContactMessage,
  ContentStrategyBrief,
  AnalyticsEvent,
  PostAnalytics,
  SiteAnalytics,
};
