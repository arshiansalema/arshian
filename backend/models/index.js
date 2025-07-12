const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const Contact = require('./Contact');

// Define associations
Category.hasMany(Product, { 
  foreignKey: 'categoryId',
  as: 'products'
});

Product.belongsTo(Category, { 
  foreignKey: 'categoryId',
  as: 'category'
});

module.exports = {
  User,
  Category,
  Product,
  Contact
};