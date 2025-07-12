const express = require('express');
const { Op } = require('sequelize');
const { User, Product, Category, Contact } = require('../models');
const { auth, adminOnly, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Products statistics
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { isActive: true } });
    const featuredProducts = await Product.count({ where: { isFeatured: true } });
    const outOfStockProducts = await Product.count({ where: { stockStatus: 'out_of_stock' } });

    // Categories statistics
    const totalCategories = await Category.count();
    const activeCategories = await Category.count({ where: { isActive: true } });

    // Contact statistics
    const totalContacts = await Contact.count();
    const newContacts = await Contact.count({ where: { status: 'new' } });
    const unreadContacts = await Contact.count({ where: { isRead: false } });
    const monthlyContacts = await Contact.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });
    const lastMonthContacts = await Contact.count({
      where: {
        createdAt: {
          [Op.between]: [startOfLastMonth, endOfLastMonth]
        }
      }
    });

    // User statistics
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });

    // Recent activity
    const recentContacts = await Contact.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'subject', 'status', 'inquiryType', 'createdAt']
    });

    const recentProducts = await Product.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'price', 'isActive', 'createdAt'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    // Monthly contact trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await Contact.count({
        where: {
          createdAt: {
            [Op.between]: [monthStart, monthEnd]
          }
        }
      });

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        contacts: count
      });
    }

    // Inquiry type distribution
    const inquiryStats = await Contact.findAll({
      attributes: [
        'inquiryType',
        [Contact.sequelize.fn('COUNT', Contact.sequelize.col('id')), 'count']
      ],
      group: ['inquiryType']
    });

    // Top categories by product count
    const categoryStats = await Category.findAll({
      attributes: [
        'id',
        'name',
        [Category.sequelize.fn('COUNT', Category.sequelize.col('products.id')), 'productCount']
      ],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [],
          where: { isActive: true },
          required: false
        }
      ],
      group: ['Category.id', 'Category.name'],
      order: [[Category.sequelize.fn('COUNT', Category.sequelize.col('products.id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          products: {
            total: totalProducts,
            active: activeProducts,
            featured: featuredProducts,
            outOfStock: outOfStockProducts
          },
          categories: {
            total: totalCategories,
            active: activeCategories
          },
          contacts: {
            total: totalContacts,
            new: newContacts,
            unread: unreadContacts,
            monthly: monthlyContacts,
            lastMonth: lastMonthContacts,
            growth: lastMonthContacts > 0 ? ((monthlyContacts - lastMonthContacts) / lastMonthContacts * 100).toFixed(1) : 0
          },
          users: {
            total: totalUsers,
            active: activeUsers
          }
        },
        charts: {
          monthlyTrends,
          inquiryStats: inquiryStats.map(stat => ({
            type: stat.inquiryType,
            count: parseInt(stat.get('count'))
          })),
          categoryStats: categoryStats.map(cat => ({
            id: cat.id,
            name: cat.name,
            productCount: parseInt(cat.get('productCount'))
          }))
        },
        recentActivity: {
          contacts: recentContacts,
          products: recentProducts
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Super Admin)
router.get('/users', auth, superAdminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, active, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (active !== undefined) where.isActive = active === 'true';
    
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / limit),
          totalItems: users.count,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(users.count / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (Super Admin)
router.put('/users/:id/toggle-status', auth, superAdminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent super admin from deactivating themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    await user.update({ isActive: !user.isActive });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: { ...user.toJSON(), password: undefined } }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics/products
// @desc    Get product analytics
// @access  Private (Admin)
router.get('/analytics/products', auth, adminOnly, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Product creation trends
    const productTrends = await Product.findAll({
      attributes: [
        [Product.sequelize.fn('DATE', Product.sequelize.col('createdAt')), 'date'],
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [Product.sequelize.fn('DATE', Product.sequelize.col('createdAt'))],
      order: [[Product.sequelize.fn('DATE', Product.sequelize.col('createdAt')), 'ASC']]
    });

    // Products by category
    const categoryDistribution = await Category.findAll({
      attributes: [
        'id',
        'name',
        [Category.sequelize.fn('COUNT', Category.sequelize.col('products.id')), 'count']
      ],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [],
          where: { isActive: true },
          required: false
        }
      ],
      group: ['Category.id', 'Category.name'],
      order: [[Category.sequelize.fn('COUNT', Category.sequelize.col('products.id')), 'DESC']]
    });

    // Stock status distribution
    const stockStats = await Product.findAll({
      attributes: [
        'stockStatus',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      group: ['stockStatus']
    });

    // Price distribution
    const priceRanges = [
      { min: 0, max: 1000, label: '0-1000' },
      { min: 1001, max: 5000, label: '1001-5000' },
      { min: 5001, max: 10000, label: '5001-10000' },
      { min: 10001, max: 50000, label: '10001-50000' },
      { min: 50001, max: 999999, label: '50000+' }
    ];

    const priceDistribution = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await Product.count({
          where: {
            price: {
              [Op.between]: [range.min, range.max]
            },
            isActive: true
          }
        });
        return { range: range.label, count };
      })
    );

    res.json({
      success: true,
      data: {
        trends: productTrends.map(trend => ({
          date: trend.get('date'),
          count: parseInt(trend.get('count'))
        })),
        categoryDistribution: categoryDistribution.map(cat => ({
          id: cat.id,
          name: cat.name,
          count: parseInt(cat.get('count'))
        })),
        stockStats: stockStats.map(stat => ({
          status: stat.stockStatus,
          count: parseInt(stat.get('count'))
        })),
        priceDistribution
      }
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/export/contacts
// @desc    Export contacts to CSV
// @access  Private (Admin)
router.get('/export/contacts', auth, adminOnly, async (req, res) => {
  try {
    const { status, inquiryType, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;
    if (inquiryType) where.inquiryType = inquiryType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const contacts = await Contact.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Create CSV content
    const csvHeader = 'ID,Name,Email,Phone,Company,Subject,Message,Inquiry Type,Status,Priority,Created At,Updated At\n';
    const csvRows = contacts.map(contact => {
      return [
        contact.id,
        `"${contact.name}"`,
        contact.email,
        contact.phone || '',
        `"${contact.company || ''}"`,
        `"${contact.subject || ''}"`,
        `"${contact.message.replace(/"/g, '""')}"`,
        contact.inquiryType,
        contact.status,
        contact.priority,
        contact.createdAt.toISOString(),
        contact.updatedAt.toISOString()
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contacts_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during export'
    });
  }
});

module.exports = router;