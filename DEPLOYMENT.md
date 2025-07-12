# Deployment Guide - Pump Manufacturing Website

This guide will walk you through deploying the pump manufacturing website to production using Vercel (Frontend), Render (Backend), and PlanetScale (Database).

## 🚀 Deployment Overview

- **Frontend**: Vercel (React.js)
- **Backend**: Render (Node.js + Express)
- **Database**: PlanetScale (MySQL)
- **File Storage**: Cloudinary or AWS S3 (for product images)

## 🗄️ Database Deployment (PlanetScale)

### 1. Create PlanetScale Database

1. **Sign up for PlanetScale**: [https://planetscale.com](https://planetscale.com)
2. **Create a new database**:
   ```bash
   # Install PlanetScale CLI
   npm install -g @planetscale/cli
   
   # Login to PlanetScale
   pscale auth login
   
   # Create database
   pscale database create pump-manufacturing
   ```

3. **Create a connection string**:
   ```bash
   # Create a password for your database
   pscale password create pump-manufacturing main <password-name>
   ```

4. **Get connection details**:
   - Host: `<host-url>`
   - Username: `<username>`
   - Password: `<password>`
   - Database: `pump-manufacturing`

### 2. Alternative: ClearDB (Heroku Add-on)

If you prefer ClearDB:

1. **Create a ClearDB instance**
2. **Get connection URL**: `mysql://username:password@host:port/database`
3. **Use this URL in your environment variables**

## 🖥️ Backend Deployment (Render)

### 1. Prepare Backend for Deployment

1. **Update package.json** (already done):
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "build": "echo 'No build step required'"
     }
   }
   ```

2. **Ensure environment variables are set**:
   ```env
   DATABASE_URL=mysql://username:password@host:port/database
   JWT_SECRET=your_production_jwt_secret
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

### 2. Deploy to Render

1. **Sign up for Render**: [https://render.com](https://render.com)

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variables**:
   ```env
   DATABASE_URL=your_planetscale_connection_string
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Note your backend URL: `https://your-backend-name.onrender.com`

### 3. Initialize Database

After deployment, initialize your database:

1. **Run the seeder** (you can do this via Render's shell or a one-time script):
   ```bash
   # Access Render shell or create a script endpoint
   node seeders/initial-data.js
   ```

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend for Deployment

1. **Create production environment file**:
   ```env
   # .env.production
   REACT_APP_API_URL=https://your-backend-name.onrender.com/api
   ```

2. **Update build configuration** (if needed):
   ```json
   {
     "scripts": {
       "build": "react-scripts build"
     }
   }
   ```

### 2. Deploy to Vercel

1. **Sign up for Vercel**: [https://vercel.com](https://vercel.com)

2. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

3. **Deploy via Dashboard**:
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Root Directory: `frontend`
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Set Environment Variables**:
   ```env
   REACT_APP_API_URL=https://your-backend-name.onrender.com/api
   ```

5. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Note your frontend URL: `https://your-project-name.vercel.app`

### 3. Alternative: Deploy via CLI

```bash
cd frontend
vercel --prod
```

## 📧 Email Configuration

### Using Gmail

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → App passwords
   - Generate password for "Mail"
3. **Use the app password** in your environment variables

### Using SendGrid

1. **Sign up for SendGrid**: [https://sendgrid.com](https://sendgrid.com)
2. **Create API Key**
3. **Update email configuration**:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your_sendgrid_api_key
   ```

## 📁 File Storage Setup

### Option 1: Cloudinary

1. **Sign up for Cloudinary**: [https://cloudinary.com](https://cloudinary.com)
2. **Get credentials**:
   - Cloud Name
   - API Key
   - API Secret
3. **Add to environment variables**:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Option 2: AWS S3

1. **Create S3 bucket**
2. **Create IAM user** with S3 permissions
3. **Add credentials**:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   AWS_BUCKET_NAME=your_bucket_name
   ```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

## 📊 Monitoring and Analytics

### 1. Backend Monitoring

1. **Render provides built-in monitoring**
2. **Add custom health checks**:
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'OK', timestamp: new Date().toISOString() });
   });
   ```

### 2. Frontend Analytics

1. **Google Analytics**:
   ```html
   <!-- Add to public/index.html -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   ```

2. **Error Tracking** (Sentry):
   ```bash
   npm install @sentry/react
   ```

## 🔧 Production Optimizations

### 1. Backend Optimizations

1. **Enable compression**:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add caching headers**:
   ```javascript
   app.use(express.static('uploads', {
     maxAge: '1y',
     etag: false
   }));
   ```

### 2. Frontend Optimizations

1. **Code splitting** (already enabled with React)
2. **Image optimization**:
   ```javascript
   // Use next/image or react-image-optimize
   ```

3. **PWA features**:
   ```bash
   npx create-react-app frontend --template cra-template-pwa
   ```

## 🛡️ Security Checklist

### Production Security

- [ ] Environment variables set correctly
- [ ] JWT secret is strong (32+ characters)
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Database connection encrypted
- [ ] File upload restrictions enabled
- [ ] Error messages don't expose sensitive info

## 🚀 Post-Deployment Steps

### 1. Verify Deployment

1. **Test all endpoints**:
   ```bash
   # Test backend health
   curl https://your-backend-name.onrender.com/api/health
   
   # Test frontend
   curl https://your-project-name.vercel.app
   ```

2. **Test admin login**:
   - Go to `https://your-project-name.vercel.app/admin/login`
   - Use default credentials: `admin@pumpmanufacturing.com` / `admin123456`
   - Change password immediately

### 2. Configure Domain (Optional)

1. **Purchase domain** from registrar
2. **Configure DNS**:
   - Add CNAME record for frontend: `www.yourdomain.com` → `your-project-name.vercel.app`
   - Add CNAME record for API: `api.yourdomain.com` → `your-backend-name.onrender.com`

### 3. Set Up Backups

1. **Database backups** (PlanetScale provides automatic backups)
2. **Code backups** (GitHub repository)
3. **File backups** (Cloudinary/S3 provides redundancy)

## 📋 Deployment Checklist

- [ ] Database created and configured
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Database seeded with initial data
- [ ] Email configuration working
- [ ] File upload working
- [ ] All API endpoints tested
- [ ] Frontend routes working
- [ ] Admin login working
- [ ] Default password changed
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Domain configured (if applicable)
- [ ] Monitoring set up
- [ ] Backups configured

## 🆘 Troubleshooting

### Common Issues

1. **Database connection failed**:
   - Check DATABASE_URL format
   - Verify database credentials
   - Check firewall settings

2. **CORS errors**:
   - Verify FRONTEND_URL in backend env
   - Check CORS configuration

3. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check build logs for specific errors

4. **Email not sending**:
   - Verify SMTP credentials
   - Check email provider settings
   - Test with simple SMTP client

### Getting Help

- **Render Support**: [https://render.com/docs](https://render.com/docs)
- **Vercel Support**: [https://vercel.com/docs](https://vercel.com/docs)
- **PlanetScale Support**: [https://planetscale.com/docs](https://planetscale.com/docs)

## 📈 Performance Monitoring

After deployment, monitor:

1. **Response times**
2. **Error rates**
3. **Database performance**
4. **User engagement**
5. **Server resource usage**

Your pump manufacturing website is now ready for production! 🎉