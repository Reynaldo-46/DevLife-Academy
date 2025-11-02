# Quick Start Guide

Get DevLife Academy running on your local machine in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed

## Step 1: Clone the Repository

```bash
git clone https://github.com/Reynaldo-46/DevLife-Academy.git
cd DevLife-Academy
```

## Step 2: Set Up PostgreSQL Database

Create a new database:
```bash
# Using psql
createdb devlife_academy

# Or connect to PostgreSQL and run:
CREATE DATABASE devlife_academy;
```

## Step 3: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and update DATABASE_URL:
# DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/devlife_academy"
```

Edit `backend/.env` with your settings:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devlife_academy"
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

**Create the admin account:**
```bash
npm run prisma:seed
```

This creates an admin account with:
- Email: `admin@devlifeacademy.com`
- Password: `AdminPassword123!`

💡 **Tip:** Customize admin credentials by editing `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `.env` before running the seed.

Start the backend:
```bash
npm run start:dev
```

✅ Backend running at http://localhost:3001
📚 API Docs at http://localhost:3001/api/docs

## Step 4: Frontend Setup

Open a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

The `.env` should contain:
```env
VITE_API_URL=http://localhost:3001
```

Start the frontend:
```bash
npm run dev
```

✅ Frontend running at http://localhost:5173

## Step 5: Login as Admin

1. Open http://localhost:5173 in your browser
2. Click "Login" in the navigation bar
3. Enter admin credentials:
   - Email: `admin@devlifeacademy.com`
   - Password: `AdminPassword123!`
4. You're now logged in as admin! 🎉

As admin, you can:
- Upload and manage videos
- Create playlists/courses
- View analytics
- Access all platform features

## Step 6: Create a Viewer Account (Optional)

To test the viewer experience:
1. Logout from admin account
2. Click "Sign Up"
3. Create a new account (automatically assigned VIEWER role)
4. Verify your email using the token shown
5. Login and view content

## Admin Setup

You can create a seed file to populate test data:

```bash
cd backend
# Create prisma/seed.ts with sample users and videos
npx prisma db seed
```

## Common Issues

### Port Already in Use
```bash
# Backend (3001)
lsof -ti:3001 | xargs kill -9

# Frontend (5173)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env`
- Ensure database exists: `psql -l`

### Prisma Generate Fails
```bash
rm -rf node_modules
npm install
npx prisma generate
```

## Next Steps

1. **Explore the API**: Visit http://localhost:3001/api/docs
2. **Create Videos**: Register as a creator and add content
3. **Test Features**: 
   - Upload video metadata
   - Create playlists
   - Add comments
   - Test authentication
4. **Read Documentation**: Check README.md for full features

## Development Commands

### Backend
```bash
npm run start:dev     # Development mode with hot reload
npm run build         # Build for production
npm run start:prod    # Run production build
npx prisma studio     # Open Prisma Studio (database GUI)
npx prisma migrate dev # Create new migration
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

## VS Code Setup (Recommended)

Install these extensions:
- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense

## API Quick Reference

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh token

### Videos
- GET `/api/videos` - List videos
- GET `/api/videos/:id` - Get video
- POST `/api/videos` - Create video (creator only)
- PUT `/api/videos/:id` - Update video
- DELETE `/api/videos/:id` - Delete video

### Full API docs: http://localhost:3001/api/docs

---

Need help? Check the README.md or DEPLOYMENT.md files!

Happy coding! 🚀
