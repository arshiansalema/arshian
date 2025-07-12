# Pump Manufacturing Website

A comprehensive full-stack web application for a pump manufacturing company, featuring a public website with product showcase and a complete admin dashboard for managing products, categories, and customer inquiries.

## 🚀 Live Demo

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: MySQL (ClearDB or PlanetScale)

## 🛠️ Tech Stack

### Frontend
- **React.js** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for state management
- **React Hook Form** for form handling
- **Framer Motion** for animations
- **Chart.js** for admin analytics
- **Axios** for API calls
- **React Toastify** for notifications

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **Sequelize** ORM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Express Validator** for input validation
- **Nodemailer** for email notifications
- **Helmet** for security

## 📁 Project Structure

```
pump-manufacturing-website/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   └── Contact.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   ├── contact.js
│   │   └── admin.js
│   ├── seeders/
│   │   └── initial-data.js
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── Admin/
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Dashboard/
│   │   │   ├── Auth/
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── UI/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Modal.tsx
│   │   │   └── Product/
│   │   │       ├── ProductCard.tsx
│   │   │       ├── ProductFilter.tsx
│   │   │       └── ProductGrid.tsx
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   │   ├── Home.tsx
│   │   │   │   └── components/
│   │   │   │       ├── HeroSection.tsx
│   │   │   │       ├── FeaturedProducts.tsx
│   │   │   │       ├── CompanyStats.tsx
│   │   │   │       ├── WhyChooseUs.tsx
│   │   │   │       └── Testimonials.tsx
│   │   │   ├── Products/
│   │   │   │   ├── Products.tsx
│   │   │   │   └── ProductDetail.tsx
│   │   │   ├── Contact/
│   │   │   │   └── Contact.tsx
│   │   │   └── Admin/
│   │   │       ├── AdminLogin.tsx
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── AdminProducts.tsx
│   │   │       ├── AdminCategories.tsx
│   │   │       ├── AdminContacts.tsx
│   │   │       └── AdminUsers.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useCategories.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── productService.ts
│   │   │   └── contactService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── api.ts
│   │   │   ├── validation.ts
│   │   │   └── helpers.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pump-manufacturing-website.git
   cd pump-manufacturing-website
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   **Backend** (.env):
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=pump_manufacturing
   DB_PORT=3306
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend** (.env):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Set up the database**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE pump_manufacturing;
   EXIT;
   
   # Run seeders to populate initial data
   cd backend
   node seeders/initial-data.js
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately
   npm run backend:dev
   npm run frontend:dev
   ```

## 📊 Features

### Public Website

#### 🏠 Home Page
- Hero section with company branding
- Featured products showcase
- Company statistics and achievements
- Why choose us section
- Customer testimonials
- Call-to-action sections

#### 📦 Products Page
- Product grid with filtering and sorting
- Search functionality
- Category-based filtering
- Price range filtering
- Product detail pages with specifications
- Technical details and applications
- Image gallery and brochure downloads

#### 📞 Contact Page
- Contact form with validation
- Company information and location
- Google Maps integration
- Multiple inquiry types
- Email notifications to admin

### Admin Dashboard

#### 📊 Dashboard Overview
- Key metrics and statistics
- Charts and analytics
- Recent activity feed
- Quick action buttons

#### 🛠️ Product Management
- CRUD operations for products
- Category assignment
- Image upload and management
- SEO settings
- Stock status tracking
- Featured products management

#### 📁 Category Management
- Create, edit, delete categories
- Category hierarchy
- Sort order management
- Active/inactive status

#### 📧 Contact Management
- View all customer inquiries
- Status tracking (new, in progress, resolved)
- Priority levels
- Admin notes and responses
- Export to CSV

#### 👥 User Management (Super Admin)
- Create admin users
- Role-based access control
- User status management
- Activity tracking

## 🔒 Authentication & Security

- **JWT-based authentication**
- **Password hashing with bcrypt**
- **Role-based access control**
- **Input validation and sanitization**
- **Rate limiting**
- **CORS configuration**
- **Helmet security headers**

## 📱 Responsive Design

- **Mobile-first approach**
- **Tailwind CSS utility classes**
- **Responsive grid layouts**
- **Touch-friendly interfaces**
- **Optimized images**

## 🎨 UI/UX Features

- **Modern, clean design**
- **Smooth animations with Framer Motion**
- **Interactive hover effects**
- **Loading states and error handling**
- **Toast notifications**
- **Form validation feedback**
- **Dark mode support (Admin)**

## 📈 Performance Optimization

- **Code splitting**
- **Lazy loading**
- **Image optimization**
- **Caching strategies**
- **Database query optimization**
- **Minification and compression**

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Configure build and start commands
4. Deploy automatically on push to main branch

### Database (ClearDB/PlanetScale)
1. Create a MySQL database instance
2. Update DATABASE_URL in environment variables
3. Run migrations and seeders

## 📧 Email Configuration

The application uses Nodemailer for sending emails. Configure your email service:

1. **Gmail**: Use app-specific passwords
2. **SendGrid**: Use API keys
3. **Other SMTP**: Configure host, port, and credentials

## 🔧 Environment Variables

### Backend Environment Variables
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=pump_manufacturing
DB_PORT=3306
DATABASE_URL=mysql://user:pass@host:port/database

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_password

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new admin (Super Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Product Endpoints
- `GET /api/products` - Get all products with filtering
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `POST /api/products` - Create new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Category Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Contact Endpoints
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (Admin)
- `GET /api/contact/:id` - Get contact by ID (Admin)
- `PUT /api/contact/:id` - Update contact (Admin)
- `DELETE /api/contact/:id` - Delete contact (Admin)

### Admin Endpoints
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/analytics/products` - Get product analytics
- `GET /api/admin/export/contacts` - Export contacts to CSV

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@pumpmanufacturing.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- React.js community for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- All contributors and open-source libraries used in this project

---

## 📋 Default Admin Credentials

After running the seeder, you can log in with:
- **Email**: admin@pumpmanufacturing.com
- **Password**: admin123456

**⚠️ Important**: Change the default password immediately after first login!

## 🔍 Features Overview

### Public Website Features
- ✅ Responsive design
- ✅ Product catalog with filtering
- ✅ Contact form
- ✅ SEO optimized
- ✅ Fast loading
- ✅ Mobile-friendly

### Admin Dashboard Features
- ✅ Product management
- ✅ Category management
- ✅ Contact management
- ✅ User management
- ✅ Analytics and reporting
- ✅ File upload
- ✅ Export functionality

### Technical Features
- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ Input validation
- ✅ Error handling
- ✅ API documentation
- ✅ Database migrations
- ✅ Email notifications
- ✅ Security headers
- ✅ Rate limiting

This comprehensive solution provides everything needed for a professional pump manufacturing company website with full admin capabilities!