const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { Contact } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', [
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, company, subject, message, inquiryType } = req.body;

    // Create contact record
    const contact = await Contact.create({
      name,
      email,
      phone,
      company,
      subject,
      message,
      inquiryType: inquiryType || 'general'
    });

    // Send email notification to admin (if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = createTransporter();
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Admin email
          subject: `New Contact Form Submission - ${subject || 'General Inquiry'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Company:</strong> ${company || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${subject || 'Not provided'}</p>
                <p><strong>Inquiry Type:</strong> ${inquiryType || 'general'}</p>
                <p><strong>Message:</strong></p>
                <div style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin-top: 10px;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px; color: #666;">
                <p>This email was sent from your pump manufacturing website contact form.</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
      data: { 
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
          inquiryType: contact.inquiryType,
          createdAt: contact.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during form submission'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact submissions (Admin only)
// @access  Private (Admin)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      inquiryType,
      priority,
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (inquiryType) where.inquiryType = inquiryType;
    if (priority) where.priority = priority;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const orderOptions = {
      name: ['name', sortOrder],
      email: ['email', sortOrder],
      status: ['status', sortOrder],
      priority: ['priority', sortOrder],
      createdAt: ['createdAt', sortOrder],
      updatedAt: ['updatedAt', sortOrder]
    };

    const order = [orderOptions[sortBy] || orderOptions.createdAt];

    const contacts = await Contact.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
    });

    res.json({
      success: true,
      data: {
        contacts: contacts.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(contacts.count / limit),
          totalItems: contacts.count,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(contacts.count / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/contact/:id
// @desc    Get contact by ID
// @access  Private (Admin)
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read when viewed
    if (!contact.isRead) {
      await contact.update({ isRead: true });
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/contact/:id
// @desc    Update contact status/notes
// @access  Private (Admin)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    const { status, priority, adminNotes, isRead } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (isRead !== undefined) updateData.isRead = isRead;

    if (status === 'resolved' || status === 'closed') {
      updateData.respondedAt = new Date();
    }

    await contact.update(updateData);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact }
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during contact update'
    });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete contact
// @access  Private (Admin)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during contact deletion'
    });
  }
});

// @route   GET /api/contact/stats/overview
// @desc    Get contact statistics
// @access  Private (Admin)
router.get('/stats/overview', auth, adminOnly, async (req, res) => {
  try {
    const totalContacts = await Contact.count();
    const newContacts = await Contact.count({ where: { status: 'new' } });
    const inProgressContacts = await Contact.count({ where: { status: 'in_progress' } });
    const resolvedContacts = await Contact.count({ where: { status: 'resolved' } });
    const unreadContacts = await Contact.count({ where: { isRead: false } });

    // Get contacts by inquiry type
    const inquiryStats = await Contact.findAll({
      attributes: [
        'inquiryType',
        [Contact.sequelize.fn('COUNT', Contact.sequelize.col('id')), 'count']
      ],
      group: ['inquiryType']
    });

    // Get recent contacts
    const recentContacts = await Contact.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'subject', 'status', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: totalContacts,
          new: newContacts,
          inProgress: inProgressContacts,
          resolved: resolvedContacts,
          unread: unreadContacts
        },
        inquiryStats: inquiryStats.map(stat => ({
          type: stat.inquiryType,
          count: parseInt(stat.get('count'))
        })),
        recentContacts
      }
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;