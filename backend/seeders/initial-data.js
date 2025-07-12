const { User, Category, Product } = require('../models');
const bcrypt = require('bcryptjs');

const seedInitialData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create super admin user
    const existingUser = await User.findOne({ where: { email: 'admin@pumpmanufacturing.com' } });
    
    if (!existingUser) {
      await User.create({
        username: 'superadmin',
        email: 'admin@pumpmanufacturing.com',
        password: 'admin123456', // This will be hashed by the model hook
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin'
      });
      console.log('✅ Super admin user created');
    } else {
      console.log('ℹ️  Super admin user already exists');
    }

    // Create sample categories
    const categories = [
      {
        name: 'Centrifugal Pumps',
        description: 'High-efficiency centrifugal pumps for various industrial applications',
        sortOrder: 1
      },
      {
        name: 'Submersible Pumps',
        description: 'Submersible pumps for water supply and drainage applications',
        sortOrder: 2
      },
      {
        name: 'Positive Displacement Pumps',
        description: 'Positive displacement pumps for precise flow control',
        sortOrder: 3
      },
      {
        name: 'Diaphragm Pumps',
        description: 'Diaphragm pumps for chemical and corrosive fluid handling',
        sortOrder: 4
      },
      {
        name: 'Gear Pumps',
        description: 'Gear pumps for high-pressure applications',
        sortOrder: 5
      },
      {
        name: 'Peristaltic Pumps',
        description: 'Peristaltic pumps for gentle fluid handling',
        sortOrder: 6
      }
    ];

    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ where: { name: categoryData.name } });
      if (!existingCategory) {
        await Category.create(categoryData);
        console.log(`✅ Created category: ${categoryData.name}`);
      }
    }

    // Create sample products
    const centrifugalCategory = await Category.findOne({ where: { name: 'Centrifugal Pumps' } });
    const submersibleCategory = await Category.findOne({ where: { name: 'Submersible Pumps' } });

    if (centrifugalCategory && submersibleCategory) {
      const products = [
        {
          name: 'Industrial Centrifugal Pump IP-500',
          categoryId: centrifugalCategory.id,
          description: 'High-performance industrial centrifugal pump designed for continuous operation in demanding environments. Features robust construction and excellent efficiency.',
          shortDescription: 'Industrial-grade centrifugal pump with superior performance and reliability.',
          price: 15000.00,
          specifications: {
            'Flow Rate': '500 L/min',
            'Head': '50 m',
            'Power': '15 HP',
            'Inlet Size': '6 inches',
            'Outlet Size': '4 inches',
            'Material': 'Cast Iron',
            'Efficiency': '85%'
          },
          technicalDetails: {
            'Impeller Type': 'Closed',
            'Shaft Sealing': 'Mechanical Seal',
            'Bearing': 'Ball Bearing',
            'Coupling': 'Flexible',
            'Motor Protection': 'IP55',
            'Temperature Range': '-10°C to 80°C'
          },
          applications: ['Industrial Processing', 'Water Treatment', 'HVAC Systems'],
          features: ['Self-priming', 'Corrosion resistant', 'Low maintenance', 'High efficiency'],
          model: 'IP-500',
          brand: 'AquaFlow',
          warranty: '2 years',
          isFeatured: true,
          stockStatus: 'in_stock',
          sortOrder: 1
        },
        {
          name: 'Submersible Water Pump SW-300',
          categoryId: submersibleCategory.id,
          description: 'Reliable submersible water pump ideal for deep well applications and water supply systems. Built with stainless steel construction for durability.',
          shortDescription: 'Durable submersible pump for deep well and water supply applications.',
          price: 8500.00,
          specifications: {
            'Flow Rate': '300 L/min',
            'Head': '80 m',
            'Power': '10 HP',
            'Diameter': '4 inches',
            'Material': 'Stainless Steel',
            'Efficiency': '82%'
          },
          technicalDetails: {
            'Motor Type': 'Submersible',
            'Cable Length': '50 meters',
            'Control Panel': 'Included',
            'Pump Type': 'Multi-stage',
            'Operating Depth': 'Up to 150m',
            'Fluid Temperature': 'Up to 35°C'
          },
          applications: ['Deep Wells', 'Water Supply', 'Irrigation', 'Drainage'],
          features: ['Submersible design', 'Stainless steel construction', 'Multi-stage', 'Energy efficient'],
          model: 'SW-300',
          brand: 'DeepFlow',
          warranty: '3 years',
          isFeatured: true,
          stockStatus: 'in_stock',
          sortOrder: 2
        },
        {
          name: 'High-Pressure Centrifugal Pump HP-750',
          categoryId: centrifugalCategory.id,
          description: 'Heavy-duty centrifugal pump designed for high-pressure applications. Perfect for industrial processes requiring high head and flow rates.',
          shortDescription: 'Heavy-duty pump for high-pressure industrial applications.',
          price: 22000.00,
          specifications: {
            'Flow Rate': '750 L/min',
            'Head': '120 m',
            'Power': '25 HP',
            'Inlet Size': '8 inches',
            'Outlet Size': '6 inches',
            'Material': 'Duplex Steel',
            'Efficiency': '88%'
          },
          technicalDetails: {
            'Impeller Type': 'Semi-open',
            'Shaft Material': 'Stainless Steel',
            'Bearing Housing': 'Cast Iron',
            'Mechanical Seal': 'Cartridge Type',
            'Motor Frame': 'TEFC',
            'Vibration Level': 'Low'
          },
          applications: ['Petrochemical', 'Power Plants', 'Mining', 'Heavy Industry'],
          features: ['High pressure capability', 'Robust construction', 'Low vibration', 'Extended service life'],
          model: 'HP-750',
          brand: 'PowerPump',
          warranty: '2 years',
          isFeatured: false,
          stockStatus: 'in_stock',
          sortOrder: 3
        }
      ];

      for (const productData of products) {
        const existingProduct = await Product.findOne({ where: { name: productData.name } });
        if (!existingProduct) {
          await Product.create(productData);
          console.log(`✅ Created product: ${productData.name}`);
        }
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📧 Super Admin Credentials:');
    console.log('   Email: admin@pumpmanufacturing.com');
    console.log('   Password: admin123456');
    console.log('');
    console.log('⚠️  Please change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

module.exports = seedInitialData;

// Run seeder if called directly
if (require.main === module) {
  const db = require('../config/database');
  
  db.authenticate()
    .then(() => {
      console.log('Database connected successfully');
      return db.sync({ force: false });
    })
    .then(() => {
      return seedInitialData();
    })
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}