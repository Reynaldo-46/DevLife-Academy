# DevLife Academy

A full-stack e-learning and vlog platform showcasing the daily life of a work-from-home full-stack developer, hands-on dad, and husband.

## 🎥 Features

### For Viewers
- Browse free & premium vlogs/tutorials
- Watch videos in responsive player with HLS support
- Like, comment, and save videos
- Subscribe via Stripe for premium access
- View creator profile, playlists, and categories
- Search videos by title, tags, or category

### For Creators
- Dashboard to upload and publish videos
- Manage video metadata (title, description, visibility, tags)
- Set video type: public, private, paid, or subscriber-only
- Organize videos into playlists/courses
- View analytics: views, watch time, earnings
- Add transcript & tags for SEO

## 🧩 Tech Stack

### Frontend
- **React** + **TypeScript** + **Vite** - Fast, modern development
- **TailwindCSS** - Responsive, utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors

### Backend
- **Node.js** + **TypeScript** - Type-safe backend
- **NestJS** - Enterprise-grade framework
- **Prisma** + **PostgreSQL** - Type-safe ORM & database
- **JWT** - Secure authentication with refresh tokens
- **Stripe** - Payment processing
- **FFmpeg** - Video transcoding (self-hosted)
- **BullMQ** + **Redis** - Background job queue
- **AWS S3** - Video storage
- **Socket.io** - Real-time notifications
- **Swagger** - API documentation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Redis server (for video transcoding queue)
- FFmpeg (for video transcoding)
- AWS S3 account (for video storage)
- Stripe account (for payments)

### Install FFmpeg
**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg redis-server
```

**macOS:**
```bash
brew install ffmpeg redis
```

See [FFMPEG_SETUP.md](FFMPEG_SETUP.md) for complete FFmpeg setup and configuration.

### Quick Start
See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your credentials (DB, AWS, Redis, Stripe)
npx prisma generate
npx prisma migrate dev
npm run prisma:seed  # Creates admin account
npm run start:dev
```

API: `http://localhost:3001`
Docs: `http://localhost:3001/api/docs`

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: `http://localhost:5173`

### Admin Access
See [ADMIN_SETUP.md](ADMIN_SETUP.md) for how to create and access your admin account.

**Default admin credentials:**
- Email: `admin@devlifeacademy.com`
- Password: `AdminPassword123!`

⚠️ Change these in your `.env` file and run `npm run prisma:seed` to create your admin account.

## 📁 Project Structure

```
DevLife-Academy/
├── backend/               # NestJS API
│   ├── prisma/           # Database schema
│   └── src/
│       ├── analytics/    # Analytics tracking
│       ├── auth/         # JWT authentication
│       ├── payments/     # Stripe integration
│       ├── playlists/    # Playlist management
│       ├── users/        # User management
│       └── videos/       # Video CRUD & comments
│
└── frontend/             # React app
    └── src/
        ├── components/   # Reusable components
        ├── context/      # State management
        ├── pages/        # Page components
        ├── services/     # API calls
        └── types/        # TypeScript types
```

## 🗄️ Database Models

- **User** - Creators & subscribers
- **Video** - Video content with metadata
- **Playlist** - Video collections
- **Subscription** - Stripe subscriptions
- **Analytics** - View tracking
- **Comment** - Nested comments
- **VideoLike** & **SavedVideo**

## 🔐 Authentication

JWT with access (15min) and refresh (7day) tokens. Automatic token refresh on API calls.

## 💳 Payments

Stripe integration for monthly/annual subscriptions with webhook handling.

## 📊 Analytics

Track views, watch time, engagement, and revenue.

## 🎨 Responsive Design

Mobile-first TailwindCSS design with `sm`, `md`, `lg`, `xl` breakpoints.

## 📝 Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories.

## 🤝 Contributing

Contributions welcome! Submit a Pull Request.

## 📄 License

ISC License

---

Built with ❤️ for the dev community
