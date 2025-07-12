const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      search, 
      featured, 
      active,
      sortBy = 'name',
      sortOrder = 'ASC',
      minPrice,
      maxPrice,
      application,
      brand
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by active status
    if (active !== 'false') {
      where.isActive = true;
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Filter by featured
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    // Filter by brand
    if (brand) {
      where.brand = brand;
    }

    // Filter by application
    if (application) {
      where.applications = {
        [Op.like]: `%${application}%`
      };
    }

    // Search functionality
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { shortDescription: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    // Sort options
    const orderOptions = {
      name: ['name', sortOrder],
      price: ['price', sortOrder],
      created: ['createdAt', sortOrder],
      updated: ['updatedAt', sortOrder],
      sort: ['sortOrder', sortOrder]
    };

    const order = [orderOptions[sortBy] || orderOptions.name];

    const products = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        products: products.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(products.count / limit),
          totalItems: products.count,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(products.count / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const products = await Product.findAll({
      where: { 
        isActive: true,
        isFeatured: true 
      },
      limit: parseInt(limit),
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/slug/:slug
// @desc    Get product by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin)
router.post('/', [
  body('name').isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),
  body('categoryId').isInt().withMessage('Category ID must be a valid integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], auth, adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      categoryId,
      description,
      shortDescription,
      images,
      price,
      priceRange,
      specifications,
      technicalDetails,
      applications,
      features,
      model,
      brand,
      warranty,
      brochureUrl,
      isFeatured,
      sortOrder,
      stockStatus,
      seoTitle,
      seoDescription,
      seoKeywords
    } = req.body;

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const product = await Product.create({
      name,
      categoryId,
      description,
      shortDescription,
      images: images || [],
      price,
      priceRange,
      specifications: specifications || {},
      technicalDetails: technicalDetails || {},
      applications: applications || [],
      features: features || [],
      model,
      brand,
      warranty,
      brochureUrl,
      isFeatured: isFeatured || false,
      sortOrder: sortOrder || 0,
      stockStatus: stockStatus || 'in_stock',
      seoTitle,
      seoDescription,
      seoKeywords
    });

    const productWithCategory = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: productWithCategory }
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Product slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during product creation'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin)
router.put('/:id', [
  body('name').optional().isLength({ min: 3 }).withMessage('Product name must be at least 3 characters'),
  body('categoryId').optional().isInt().withMessage('Category ID must be a valid integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], auth, adminOnly, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      categoryId,
      description,
      shortDescription,
      images,
      price,
      priceRange,
      specifications,
      technicalDetails,
      applications,
      features,
      model,
      brand,
      warranty,
      brochureUrl,
      isActive,
      isFeatured,
      sortOrder,
      stockStatus,
      seoTitle,
      seoDescription,
      seoKeywords
    } = req.body;

    // Check if category exists if categoryId is provided
    if (categoryId && categoryId !== product.categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    await product.update({
      name: name || product.name,
      categoryId: categoryId || product.categoryId,
      description: description !== undefined ? description : product.description,
      shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
      images: images !== undefined ? images : product.images,
      price: price !== undefined ? price : product.price,
      priceRange: priceRange !== undefined ? priceRange : product.priceRange,
      specifications: specifications !== undefined ? specifications : product.specifications,
      technicalDetails: technicalDetails !== undefined ? technicalDetails : product.technicalDetails,
      applications: applications !== undefined ? applications : product.applications,
      features: features !== undefined ? features : product.features,
      model: model !== undefined ? model : product.model,
      brand: brand !== undefined ? brand : product.brand,
      warranty: warranty !== undefined ? warranty : product.warranty,
      brochureUrl: brochureUrl !== undefined ? brochureUrl : product.brochureUrl,
      isActive: isActive !== undefined ? isActive : product.isActive,
      isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured,
      sortOrder: sortOrder !== undefined ? sortOrder : product.sortOrder,
      stockStatus: stockStatus || product.stockStatus,
      seoTitle: seoTitle !== undefined ? seoTitle : product.seoTitle,
      seoDescription: seoDescription !== undefined ? seoDescription : product.seoDescription,
      seoKeywords: seoKeywords !== undefined ? seoKeywords : product.seoKeywords
    });

    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Product slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during product update'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during product deletion'
    });
  }
});

// @route   GET /api/products/brands/list
// @desc    Get list of all brands
// @access  Public
router.get('/brands/list', async (req, res) => {
  try {
    const brands = await Product.findAll({
      attributes: ['brand'],
      where: { 
        brand: { [Op.ne]: null },
        isActive: true
      },
      group: ['brand'],
      order: [['brand', 'ASC']]
    });

    const brandList = brands.map(product => product.brand).filter(Boolean);

    res.json({
      success: true,
      data: { brands: brandList }
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;