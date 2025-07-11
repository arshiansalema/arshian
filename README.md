# Real-Time Collaborative To-Do Board

A web-based collaborative to-do board application where multiple users can log in, manage tasks, and see changes happen in real time. Built with React, Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

### Core Features
- **User Authentication**: Secure sign-up/login with hashed passwords and JWT-based authentication
- **Real-Time Collaboration**: Live updates using WebSockets - see changes instantly across all connected users
- **Kanban Board**: Drag-and-drop tasks between Todo, In Progress, and Done columns
- **Task Management**: Create, edit, delete, and assign tasks with title, description, priority, and status
- **Activity Logging**: Track every action with detailed logs (last 20 actions visible)
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

### Unique Features
- **Smart Assign**: Automatically assigns tasks to the user with the fewest active tasks
- **Conflict Resolution**: Detects when multiple users edit the same task simultaneously and provides merge/overwrite options
- **Custom Animations**: Smooth transitions and animations for enhanced UX
- **Real-time Activity Feed**: Live updates of all user actions

### Validation Rules
- Task titles must be unique per board
- Task titles cannot match column names (Todo, In Progress, Done)
- Secure authentication with password hashing

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Custom CSS** - No third-party UI frameworks
- **Socket.IO Client** - Real-time communication
- **React Beautiful DnD** - Drag and drop functionality

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database and ODM
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/todo-board
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎯 Usage Guide

### Getting Started
1. Register a new account or login with existing credentials
2. Create your first task using the "Add Task" button
3. Drag tasks between columns (Todo, In Progress, Done)
4. Assign tasks to users and set priorities
5. Use Smart Assign to automatically distribute tasks
6. Monitor real-time activity in the Activity Log panel

### Smart Assign Logic
The Smart Assign feature automatically assigns tasks to the user with the fewest currently active tasks (tasks in Todo or In Progress status). The algorithm:
1. Counts active tasks for each user
2. Identifies the user(s) with the minimum count
3. If there's a tie, randomly selects from those users
4. Assigns the task and updates all connected clients in real-time

### Conflict Handling
When two users attempt to edit the same task simultaneously:
1. The system detects the conflict using timestamps and version tracking
2. Both users see a conflict resolution dialog
3. Users can choose to:
   - **Merge**: Combine changes intelligently
   - **Overwrite**: Use their version and discard the other
   - **Cancel**: Keep the other user's changes
4. The resolution is broadcast to all connected users

## 🎨 Custom Features

### Animations
- Smooth card transitions when dragging
- Fade-in effects for new tasks
- Pulse animation for real-time updates
- Loading spinners with custom styling

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on smaller screens
- Touch-friendly drag and drop
- Optimized layouts for different screen sizes

## 🚢 Deployment

### Frontend Deployment (Vercel)
```bash
cd frontend
npm run build
```
Deploy to Vercel by connecting your GitHub repository.

### Backend Deployment (Render/Railway)
1. Set environment variables in your hosting platform
2. Update MONGODB_URI to your cloud MongoDB instance
3. Deploy the backend directory

### Environment Variables for Production
```env
PORT=5000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
FRONTEND_URL=your-frontend-deployment-url
```

## 📁 Project Structure

```
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   └── package.json
├── docs/
│   └── Logic_Document.md
└── README.md
```

## 🎥 Demo Video
[Demo Video Link](your-demo-video-link-here)

## 📄 Logic Document
Detailed explanations of Smart Assign and Conflict Handling logic can be found in [Logic_Document.md](./docs/Logic_Document.md)

## 🔗 Live Demo
[Live Application](your-deployed-app-url-here)

## 👨‍💻 Development

### Available Scripts

#### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

#### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License
This project is licensed under the MIT License.

## 🤝 Support
For support, email your-email@example.com or create an issue in the repository.