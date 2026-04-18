# CareerLink Backend

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with your configuration

3. Make sure MongoDB is running on your system

4. Start the server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- POST /api/auth/register/student
- POST /api/auth/register/recruiter
- POST /api/auth/register/admin
- POST /api/auth/register/alumni
- POST /api/auth/login

### Health Check

- GET /api/health


# CareerLink Backend

> RESTful API backend for AI-powered campus placement management system

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.5-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [Real-Time Communication](#real-time-communication)
- [AI Integration](#ai-integration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

CareerLink Backend is a robust, scalable REST API built with Node.js and Express.js that powers the campus placement management system. It provides comprehensive endpoints for managing users, jobs, applications, notifications, analytics, and real-time communication.

**Live API:** [https://careerlink-backend-itv6.onrender.com](https://careerlink-backend-itv6.onrender.com)

**API Health Check:** `GET /api/health`

## ✨ Features

### 🔐 Authentication & Authorization
- **Multi-Role Registration**: Separate endpoints for Student, Recruiter, Admin, Alumni
- **JWT-Based Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control**: Middleware for protecting routes based on user roles
- **Password Encryption**: bcrypt hashing with salt rounds
- **Email Verification**: (Optional) Account verification via email

### 📊 Core Modules

#### Student Module
- Profile management with resume upload (Cloudinary)
- Job browsing with filters (location, company, CTC, branch)
- One-click job applications
- Application tracking with real-time status updates
- ATS score viewing
- Notification management

#### Recruiter Module
- Job posting with detailed requirements
- Application review with ATS scores
- **Auto-Shortlist**: Automatically select top 30% candidates
- **Bulk Operations**: Update 200+ applications simultaneously
- Analytics dashboard with recruitment metrics
- Status update across recruitment stages

#### Admin Module
- User management (approve/reject/delete)
- Job approval workflow
- Comprehensive analytics (branch-wise, company-wise)
- Report generation with Excel export
- Platform-wide announcements
- Application oversight

#### Alumni Module
- Job referral posting
- Career guidance sharing
- Experience contribution to feed
- Account lifecycle management

### 🤖 AI-Powered Features
- **ATS Resume Scoring**: Google Gemini Flash 2.5 integration
- **Resume Parsing**: Automatic extraction of skills, experience, education
- **Skill Matching**: Compatibility score calculation (0-100%)
- **Auto-Shortlist Algorithm**: Intelligent candidate selection

### 🔔 Real-Time Communication
- **Socket.IO Integration**: WebSocket-based real-time updates
- **Instant Notifications**: Job postings, status updates, announcements
- **Notification Delivery**: <3 seconds average delivery time
- **Browser Notification Support**: Push notification data

### 📈 Analytics & Reporting
- Dashboard statistics for all user roles
- Branch-wise placement analysis
- Company-wise recruitment trends
- Placement rate calculations
- Excel export with custom filters
- Advanced analytics with date ranges

## 🛠 Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 18.x |
| **Express.js** | Web Framework | 4.18+ |
| **MongoDB** | Database | 6.0+ |
| **Mongoose** | ODM | 8.0+ |
| **JWT** | Authentication | Latest |
| **bcrypt** | Password Hashing | 5.1+ |
| **Socket.IO** | Real-time Communication | 4.5+ |
| **Cloudinary** | File Storage | 1.40+ |
| **Google Gemini AI** | Resume Analysis | Flash 2.5 |
| **Express Validator** | Input Validation | 7.0+ |
| **CORS** | Cross-Origin Requests | 2.8+ |
| **Helmet** | Security Headers | 7.1+ |
| **Morgan** | HTTP Logger | 1.10+ |
| **dotenv** | Environment Management | 16.3+ |
| **ExcelJS** | Excel Generation | 4.3+ |

## 📦 Prerequisites

Before running this project, ensure you have:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **MongoDB**: v6.0+ (Local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git**: For version control ([Download](https://git-scm.com/))
- **Cloudinary Account**: For file storage ([Sign up](https://cloudinary.com/))
- **Google Gemini API Key**: For AI features ([Get API Key](https://ai.google.dev/))

## 🚀 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/careerlink-backend.git
cd careerlink-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies from `package.json`.

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration (see [Environment Variables](#environment-variables)).

### Step 4: Setup Database

Ensure MongoDB is running (if using local MongoDB):

```bash
# macOS/Linux
sudo systemctl start mongod

# Or if using MongoDB Atlas, just configure MONGO_URI in .env
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/careerlink_db?retryWrites=true&w=majority
# For local MongoDB: mongodb://localhost:27017/careerlink_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=30d

# Cloudinary Configuration (for resume storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
# Production: https://career-link-frontend-henna.vercel.app

# Email Configuration (Optional - for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=5242880
# 5MB in bytes

# Session Configuration
SESSION_SECRET=your-session-secret

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@careerlink.com
ADMIN_PASSWORD=admin123
```

### Environment Variables Explanation

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `JWT_EXPIRE` | JWT token expiration time | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `FRONTEND_URL` | Frontend origin for CORS | Yes |
| `EMAIL_USER` | Email for notifications | No |
| `EMAIL_PASSWORD` | Email app password | No |

**⚠️ Security Notes:**
- Never commit `.env` to version control
- Use strong, unique values for all secrets
- Rotate secrets regularly in production
- Use environment-specific configurations

## 🗄 Database Setup

### MongoDB Atlas Setup (Cloud - Recommended)

1. **Create Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Select free tier (M0)
   - Choose cloud provider and region
   - Create cluster

3. **Configure Access**:
   - Database Access → Add new user
   - Network Access → Add IP (0.0.0.0/0 for development)

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` and `<dbname>`

5. **Update .env**:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/careerlink_db?retryWrites=true&w=majority
   ```

### Local MongoDB Setup

```bash
# Install MongoDB
# macOS
brew tap mongodb/brew
brew install mongodb-community@6.0

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongod

# Update .env
MONGO_URI=mongodb://localhost:27017/careerlink_db
```

### Database Collections

The application automatically creates these collections:

| Collection | Description |
|------------|-------------|
| `users` | User credentials and roles |
| `students` | Student profiles and academic data |
| `jobs` | Job postings from recruiters |
| `applications` | Student job applications |
| `placements` | Placement records |
| `notifications` | User notifications |
| `feed` | Alumni posts and announcements |

## 🏃 Running the Application

### Development Mode

Start the server with auto-restart on file changes:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

**Features in Development Mode:**
- Automatic server restart on code changes (nodemon)
- Detailed error logging
- CORS enabled for localhost:5173
- MongoDB query logging

### Production Mode

Run the optimized production server:

```bash
npm start
```

**Production Features:**
- Optimized performance
- Compressed responses
- Error logging to file
- Security headers enabled
- Rate limiting active

### Other Scripts

```bash
# Run linter
npm run lint

# Format code
npm run format

# Run tests (if configured)
npm test

# Database seed (create sample data)
npm run seed

# Database reset
npm run reset
```

## 📚 API Documentation

### Base URL

```
Development: http://localhost:5000/api
Production: https://careerlink-backend-itv6.onrender.com/api
```

### Authentication Endpoints

#### Register Student
```http
POST /api/auth/register/student
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "registrationNumber": "Y22ACS001",
  "branch": "Computer Science",
  "cgpa": 8.5,
  "skills": ["React", "Node.js", "MongoDB"]
}

Response: 201 Created
{
  "success": true,
  "message": "Student registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Register Recruiter
```http
POST /api/auth/register/recruiter
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "password123",
  "companyName": "Tech Corp",
  "designation": "HR Manager"
}

Response: 201 Created
{
  "success": true,
  "message": "Recruiter registered, awaiting admin approval",
  "user": { ... }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Job Management Endpoints

#### Create Job (Recruiter Only)
```http
POST /api/jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Software Developer",
  "description": "We are looking for...",
  "company": "Tech Corp",
  "location": "Bangalore",
  "salary": {
    "min": 600000,
    "max": 1000000
  },
  "eligibility": {
    "branches": ["Computer Science", "IT"],
    "minimumCGPA": 7.0
  },
  "skills": ["React", "Node.js"],
  "deadline": "2025-05-31"
}

Response: 201 Created
{
  "success": true,
  "message": "Job posted successfully, awaiting admin approval",
  "job": { ... }
}
```

#### Get All Jobs
```http
GET /api/jobs?location=Bangalore&company=Tech Corp
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "count": 10,
  "jobs": [ ... ]
}
```

#### Get Job by ID
```http
GET /api/jobs/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "job": { ... }
}
```

#### Update Job
```http
PUT /api/jobs/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "salary": { "min": 700000, "max": 1100000 }
}

Response: 200 OK
{
  "success": true,
  "message": "Job updated successfully",
  "job": { ... }
}
```

#### Delete Job
```http
DELETE /api/jobs/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### Application Endpoints

#### Apply for Job
```http
POST /api/applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "jobId": "job_id_here"
}

Response: 201 Created
{
  "success": true,
  "message": "Application submitted successfully",
  "application": { ... }
}
```

#### Get My Applications (Student)
```http
GET /api/applications/my-applications
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "applications": [ ... ]
}
```

#### Update Application Status (Recruiter/Admin)
```http
PUT /api/applications/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shortlisted"
}

Response: 200 OK
{
  "success": true,
  "message": "Application status updated",
  "application": { ... }
}
```

#### Bulk Update Applications
```http
PATCH /api/applications/bulk-update
Authorization: Bearer {token}
Content-Type: application/json

{
  "applicationIds": ["id1", "id2", "id3"],
  "status": "rejected"
}

Response: 200 OK
{
  "success": true,
  "message": "200 applications updated successfully",
  "updatedCount": 200
}
```

### ATS & Auto-Shortlist Endpoints

#### Calculate ATS Scores
```http
POST /api/applications/job/:jobId/calculate-scores
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "ATS scores calculated for 50 applications",
  "results": [ ... ]
}
```

#### Auto-Shortlist Candidates
```http
POST /api/applications/job/:jobId/auto-shortlist
Authorization: Bearer {token}
Content-Type: application/json

{
  "threshold": 70
}

Response: 200 OK
{
  "success": true,
  "message": "15 candidates auto-shortlisted (top 30%)",
  "shortlistedCount": 15,
  "totalApplications": 50
}
```

#### Export Applications
```http
GET /api/applications/job/:jobId/export
Authorization: Bearer {token}

Response: 200 OK (Excel file download)
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications?isRead=false&limit=20
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "notifications": [ ... ],
  "unreadCount": 5,
  "pagination": { ... }
}
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "count": 5
}
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Notification deleted"
}
```

### Analytics Endpoints

#### Student Dashboard Analytics
```http
GET /analytics/student/dashboard
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "stats": {
    "totalApplications": 15,
    "shortlisted": 5,
    "selected": 2,
    "rejected": 3,
    "pending": 5,
    "averageAtsScore": 75,
    "applicationTrend": [ ... ]
  }
}
```

#### Recruiter Dashboard Analytics
```http
GET /analytics/recruiter/dashboard
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "stats": {
    "totalJobs": 10,
    "totalApplications": 150,
    "shortlisted": 45,
    "selected": 10,
    "topJobs": [ ... ],
    "applicationTrend": [ ... ]
  }
}
```

#### Admin Dashboard Analytics
```http
GET /analytics/admin/dashboard
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "stats": {
    "totalStudents": 301,
    "totalRecruiters": 15,
    "totalJobs": 25,
    "totalApplications": 500,
    "placementRate": 68,
    "branchWiseStats": [ ... ],
    "companyWiseStats": [ ... ]
  }
}
```

#### Advanced Analytics
```http
GET /analytics/admin/advanced?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "analytics": { ... }
}
```

#### Export Analytics
```http
GET /analytics/admin/export?format=xlsx&branch=CSE
Authorization: Bearer {token}

Response: 200 OK (Excel file download)
```

### Feed Module Endpoints

#### Get All Posts
```http
GET /api/feed?limit=20&page=1
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "posts": [ ... ],
  "pagination": { ... }
}
```

#### Get Post by ID
```http
GET /api/feed/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "post": { ... }
}
```

#### Create Post (Admin/Recruiter/Alumni)
```http
POST /api/feed
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "Interview Tips",
  "content": "Here are some tips...",
  "category": "experience",
  "image": <file>
}

Response: 201 Created
{
  "success": true,
  "message": "Post created successfully",
  "post": { ... }
}
```

#### Update Post
```http
PUT /api/feed/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated content..."
}

Response: 200 OK
{
  "success": true,
  "message": "Post updated successfully",
  "post": { ... }
}
```

#### Pin/Unpin Post (Admin)
```http
PUT /api/feed/:id/pin
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Post pinned successfully"
}
```

#### Track Post View
```http
POST /api/feed/:id/view
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "viewCount": 125
}
```

#### Delete Post
```http
DELETE /api/feed/:id
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (development only)"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 📁 Project Structure

```
careerlink-backend/
├── config/                  # Configuration files
│   ├── db.js               # MongoDB connection
│   ├── cloudinary.js       # Cloudinary configuration
│   └── gemini.js           # Google Gemini AI config
├── controllers/            # Request handlers
│   ├── authController.js
│   ├── jobController.js
│   ├── applicationController.js
│   ├── notificationController.js
│   ├── analyticsController.js
│   └── feedController.js
├── middleware/             # Custom middleware
│   ├── auth.js            # JWT authentication
│   ├── roleAuth.js        # Role-based authorization
│   ├── errorHandler.js    # Error handling
│   ├── validator.js       # Input validation
│   └── uploadMiddleware.js # File upload handling
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Student.js
│   ├── Job.js
│   ├── Application.js
│   ├── Placement.js
│   ├── Notification.js
│   └── Feed.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── jobs.js
│   ├── applications.js
│   ├── notifications.js
│   ├── analytics.js
│   └── feed.js
├── services/               # Business logic
│   ├── atsService.js      # ATS scoring logic
│   ├── emailService.js    # Email notifications
│   ├── notificationService.js
│   └── excelService.js    # Excel export
├── socket/                 # Socket.IO configuration
│   ├── socketHandler.js
│   └── notificationSocket.js
├── utils/                  # Utility functions
│   ├── validators.js
│   ├── helpers.js
│   └── constants.js
├── .env                    # Environment variables
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies & scripts
├── server.js              # Application entry point
└── README.md              # This file
```

## 🔒 Authentication & Authorization

### JWT Authentication Flow

```javascript
// 1. User logs in
POST /api/auth/login
{ email, password }

// 2. Server validates credentials
// 3. Server generates JWT token
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// 4. Token sent to client
{ token: "eyJhbGciOiJIUzI1NiIs..." }

// 5. Client stores token (localStorage)
// 6. Client sends token in subsequent requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// 7. Server verifies token (auth middleware)
// 8. Request proceeds if valid
```

### Role-Based Access Control

```javascript
// Middleware usage in routes
router.post('/jobs', 
  auth,                    // Verify JWT token
  roleAuth(['recruiter']), // Check user role
  createJob                // Execute controller
);

router.get('/admin/analytics',
  auth,
  roleAuth(['admin']),
  getAnalytics
);

router.post('/applications',
  auth,
  roleAuth(['student']),
  applyForJob
);
```

### Protected Routes by Role

| Role | Accessible Routes |
|------|------------------|
| **Student** | Jobs (read), Applications (CRUD), Profile (CRUD), Notifications |
| **Recruiter** | Jobs (CRUD), Applications (read, update status), Analytics (own), Bulk operations |
| **Admin** | All routes, User management, Job approval, System analytics |
| **Alumni** | Feed (CRUD), Referrals (CRUD), Profile (CRUD) |

## 🔔 Real-Time Communication

### Socket.IO Integration

```javascript
// Server-side setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});

// Connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Join user-specific room
  socket.join(`user:${socket.userId}`);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// Emit notifications
const emitNotification = (userId, notification) => {
  io.to(`user:${userId}`).emit('new_notification', {
    notification,
    unreadCount: await getUnreadCount(userId)
  });
};
```

### Real-Time Events

| Event | Description | Payload |
|-------|-------------|---------|
| `new_notification` | New notification for user | `{ notification, unreadCount }` |
| `job_approved` | Job posting approved | `{ jobId, jobTitle }` |
| `application_status` | Application status changed | `{ applicationId, status }` |
| `bulk_update` | Bulk status update complete | `{ count, status }` |

## 🤖 AI Integration

### Google Gemini Flash 2.5 - ATS Scoring

```javascript
// Resume analysis and scoring
const analyzeResume = async (resumeText, jobRequirements) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this resume and calculate an ATS compatibility score (0-100%) 
    based on the following job requirements.
    
    Resume:
    ${resumeText}
    
    Job Requirements:
    - Skills: ${jobRequirements.skills.join(', ')}
    - Experience: ${jobRequirements.experience} years
    - Education: ${jobRequirements.education}
    
    Provide a JSON response with:
    {
      "score": <0-100>,
      "matchedSkills": [<list>],
      "missingSkills": [<list>],
      "summary": "<brief analysis>"
    }
  `;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  return JSON.parse(response);
};
```

### Auto-Shortlist Algorithm

```javascript
const autoShortlist = async (jobId, threshold = 70) => {
  // 1. Get all applications for job
  const applications = await Application.find({ job: jobId });
  
  // 2. Calculate ATS scores if not already calculated
  const scoredApps = await Promise.all(
    applications.map(async (app) => {
      if (!app.atsScore) {
        const score = await calculateATSScore(app);
        app.atsScore = score;
        await app.save();
      }
      return app;
    })
  );
  
  // 3. Sort by ATS score
  scoredApps.sort((a, b) => b.atsScore - a.atsScore);
  
  // 4. Select top 30% OR those above threshold
  const top30Percent = Math.ceil(scoredApps.length * 0.3);
  const shortlisted = scoredApps
    .slice(0, top30Percent)
    .filter(app => app.atsScore >= threshold);
  
  // 5. Update status to shortlisted
  const shortlistedIds = shortlisted.map(app => app._id);
  await Application.updateMany(
    { _id: { $in: shortlistedIds } },
    { status: 'shortlisted' }
  );
  
  // 6. Send notifications
  await notifyShortlisted(shortlistedIds);
  
  return {
    shortlistedCount: shortlisted.length,
    totalApplications: scoredApps.length
  };
};
```

## 🚀 Deployment

### Render Deployment (Recommended)

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect GitHub repository
   - Select branch (main)
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Environment Variables**:
   - Add all variables from `.env` in Render dashboard
   - Settings → Environment

4. **Deploy**:
   - Render auto-deploys on every push to main

### Manual Deployment

```bash
# Build and deploy to your server
git pull origin main
npm install
npm start

# Use PM2 for process management (recommended)
npm install -g pm2
pm2 start server.js --name careerlink-backend
pm2 save
pm2 startup
```

### Important Configuration

```javascript
// server.js - Production configuration
const PORT = process.env.PORT || 5000;

// CORS setup for production
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true
};
app.use(cors(corsOptions));

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/auth.test.js

# Run with coverage
npm run test:coverage
```

### Example Test

```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('Authentication', () => {
  test('POST /api/auth/login - Success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
  });

  test('POST /api/auth/login - Invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to MongoDB"

**Error:** `MongooseError: connect ECONNREFUSED`

**Solutions:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check connection string in .env
# Ensure IP whitelist in MongoDB Atlas (0.0.0.0/0 for dev)

# Test connection
mongosh "mongodb+srv://cluster.mongodb.net" --username user
```

#### 2. "JWT token verification failed"

**Error:** `JsonWebTokenError: invalid signature`

**Solutions:**
```bash
# Ensure JWT_SECRET is same in both .env and code
# Check token is being sent correctly:
Authorization: Bearer <token>  # Correct
Authorization: <token>         # Wrong

# Verify token hasn't expired
# Check JWT_EXPIRE in .env
```

#### 3. "Cloudinary upload failed"

**Error:** `CloudinaryError: Invalid credentials`

**Solutions:**
```bash
# Verify Cloudinary credentials in .env
# Test credentials at https://cloudinary.com/console

# Check file size (max 5MB by default)
# Verify allowed file types (pdf, doc, docx)
```

#### 4. "Socket.IO connection refused"

**Error:** `WebSocket connection failed`

**Solutions:**
```javascript
// Check CORS configuration
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Must match exactly
    methods: ['GET', 'POST']
  }
});

// Check frontend socket URL
// Should be: http://localhost:5000 (not /api)
```

#### 5. "Port already in use"

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

## 📝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Write/update tests
5. Commit with meaningful messages:
   ```bash
   git commit -m "feat: add job filtering by location"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a Pull Request

### Code Style

- Follow existing code patterns
- Use ESLint for code quality
- Add JSDoc comments for functions
- Keep functions small and focused
- Write meaningful commit messages

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**CareerLink Development Team**
- Sk. Mohammad Ali
- M. Hema Bhuvaneswari
- V. Sravani
- S. Naga Goutham

**Guided by:**
- K. Arun Babu, M.Tech - Assistant Professor, CSE

## 🙏 Acknowledgments

- Department of Computer Science and Engineering, Bapatla Engineering College
- Google Gemini AI team for the AI integration
- MongoDB Atlas for database hosting
- Cloudinary for file storage solutions
- All open-source contributors

## 📞 Support

For support, email: support@careerlink.com or create an issue in the repository.

## 🔗 Links

- **Frontend Repository**: [CareerLink Frontend](https://github.com/yourusername/careerlink-frontend)
- **Live Frontend**: [https://career-link-frontend-henna.vercel.app](https://career-link-frontend-henna.vercel.app)
- **Live Backend**: [https://careerlink-backend-itv6.onrender.com](https://careerlink-backend-itv6.onrender.com)
- **API Documentation**: [Postman Collection](link-to-postman)

---

**Made with ❤️ by CareerLink Team**

*Last Updated: 2025*