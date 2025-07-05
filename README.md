# AFEX - Social Media Platform

A modern social media platform built with the MERN stack, featuring AFEXClips - a short-form vertical video feed.

## Features

- ✅ Authentication (JWT-based signup/login)
- ✅ User Profiles (bio, avatar, followers/following)
- ✅ Posts (text, image, video)
- ✅ Comments on posts
- ✅ Likes system
- ✅ AFEXClips (90-second max vertical videos)
- ✅ Follow/Unfollow system
- ✅ Global feed and user profile feed
- ✅ Search (users and posts)
- ⏳ Notifications (future implementation)

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer
- **Video Processing**: FFmpeg (for AFEXClips)

## Project Structure

```
AFEX/
├── backend/           # Node.js + Express server
│   ├── config/        # Database and app configuration
│   ├── controllers/   # Route handlers
│   ├── middlewares/   # Custom middleware
│   ├── models/        # MongoDB schemas
│   ├── routes/        # API routes
│   └── utils/         # Helper functions
├── frontend/          # React application
│   └── src/
│       ├── components/ # Reusable components
│       ├── pages/      # Page components
│       ├── services/   # API calls
│       └── utils/      # Helper functions
├── .env.example       # Environment variables template
├── docker-compose.yml # Docker setup
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AFEX
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment variables
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

### Docker Setup

1. **Build and run with Docker**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/posts` - Get user posts

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `DELETE /api/posts/:id` - Delete post

### AFEXClips
- `GET /api/clips` - Get all clips
- `POST /api/clips` - Upload new clip
- `GET /api/clips/:id` - Get specific clip

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment

### Likes
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/clips/:id/like` - Like/unlike clip

### Follow
- `POST /api/users/:id/follow` - Follow/unfollow user

### Search
- `GET /api/search/users` - Search users
- `GET /api/search/posts` - Search posts

## Development

### Code Style

This project uses ESLint and Prettier for code formatting:

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
```

### Database

The project uses MongoDB. Make sure MongoDB is running locally or update the connection string in your `.env` file.

### File Uploads

- Images and videos are stored in the `uploads/` directory
- AFEXClips are processed to ensure they meet the 90-second limit
- Supported formats: JPG, PNG, MP4, MOV

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 