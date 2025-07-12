const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  priceRange: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
    // Will store: { pressure: "10 bar", flowRate: "100 L/min", material: "Cast Iron", etc. }
  },
  technicalDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
    // Will store: { headMax: "50m", powerRating: "5HP", inletSize: "4 inch", etc. }
  },
  applications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
    // Will store: ["Industrial", "Agricultural", "Residential"]
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
    // Will store: ["Self-priming", "Corrosion resistant", "Energy efficient"]
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  warranty: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  brochureUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stockStatus: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'on_order'),
    defaultValue: 'in_stock'
  },
  seoTitle: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  seoDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  seoKeywords: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (product) => {
      if (!product.slug) {
        product.slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    },
    beforeUpdate: (product) => {
      if (product.changed('name') && !product.changed('slug')) {
        product.slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
    }
  }
});

module.exports = Product;