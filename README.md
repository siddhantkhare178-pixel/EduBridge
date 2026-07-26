# EduBridge 🌉

**Learn Anywhere. Anytime. Together.**

EduBridge is a modern, offline-first learning platform that bridges the educational gap between rural and urban students. Built with cutting-edge technologies, it provides equal access to quality education through AI-powered tutoring, interactive content, gamified learning, and robust community features.

🚀 **[Live Demo](https://edu-bridge-lac.vercel.app/)** | 🐛 **[Report Bug](https://github.com/rayshivam30/edubridge/issues)**

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#️-project-structure)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [PWA Installation](#-pwa-installation)
- [Available Scripts](#-available-scripts)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## ✨ Features

### 🎓 Core Learning Platform
- **Course Management**: Create, publish, and manage comprehensive courses
- **Multi-format Content**: Support for text, videos (YouTube/uploads), and external links
- **Progress Tracking**: Real-time learning progress with completion percentages
- **Offline Support**: PWA with offline capabilities for uninterrupted learning

### 🤖 AI-Powered Learning
- **AI Tutor**: Personalized tutoring powered by Google Generative AI and OpenAI
- **Custom Quiz Generation**: AI-generated quizzes based on course content
- **Adaptive Learning**: Personalized learning paths based on student progress

### 🎮 Gamification & Engagement
- **Points & Achievements**: Earn points and unlock achievements
- **Streak System**: Maintain learning streaks for consistent progress
- **Leaderboards**: Compete with peers and track progress
- **Level System**: Progress through different learning levels

### 👥 Community Features
- **Discussion Forums**: Course-specific and general discussion threads
- **Announcements**: Teachers can broadcast updates to students
- **Social Learning**: Like, reply, and engage with community content

### 🔐 Authentication & Roles
- **NextAuth Integration**: Secure authentication with multiple providers
- **Role-based Access**: Separate dashboards for students and teachers
- **Protected Routes**: Middleware-based route protection

## 🛠️ Tech Stack

<table>
<tr>
<td>

**Frontend**
- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Framer Motion](https://www.framer.com/motion/) - Smooth animations
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Form management

</td>
<td>

**Backend & Database**
- [Prisma](https://www.prisma.io/) - Type-safe database ORM
- [PostgreSQL](https://www.postgresql.org/) - Primary database (Neon)
- [NextAuth.js](https://next-auth.js.org/) - Authentication system
- [Upstash Redis](https://upstash.com/) - Caching and session storage

</td>
</tr>
<tr>
<td>

**AI & External Services**
- [Groq SDK](https://groq.com/) - Fast AI inference
- [Cloudinary](https://cloudinary.com/) - Media management

</td>
<td>

**PWA & Performance**
- [Workbox](https://developers.google.com/web/tools/workbox) - Service worker functionality
- [Dexie](https://dexie.org/) - IndexedDB wrapper for offline data

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** ([Install guide](https://pnpm.io/installation))
- **PostgreSQL** database or [Neon](https://neon.tech/) account
- **Cloudinary** account for media storage

### One-Click Setup

```bash
# Clone and setup
git clone <repository-url>
cd edubridge
pnpm install

# Setup environment (copy and configure)
cp .env.example .env

# Initialize database
pnpm prisma generate
pnpm prisma db push

# Start development
pnpm dev
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/edubridge"

# NextAuth (Required)
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Required for social login)
GITHUB_ID="your-github-oauth-app-id"
GITHUB_SECRET="your-github-oauth-app-secret"
GOOGLE_ID="your-google-oauth-client-id"
GOOGLE_SECRET="your-google-oauth-client-secret"

# AI Services (Required for AI features)
GROQ_API_KEY="your-groq-api-key"

# Cloudinary (Required for media uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Redis (Optional - for caching)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

<details>
<summary>🔧 Detailed Setup Instructions</summary>

#### Database Setup Options

**Option 1: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create database
createdb edubridge
```

**Option 2: Neon (Recommended)**
1. Sign up at [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

#### OAuth Providers Setup

**GitHub OAuth App**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID to `GITHUB_ID`
5. Generate and copy Client Secret to `GITHUB_SECRET`

**Google OAuth App**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID to `GOOGLE_ID`
7. Copy Client Secret to `GOOGLE_SECRET`

#### AI Service Setup

**Groq (Primary AI Provider)**
1. Sign up at [groq.com](https://groq.com/)
2. Generate API key
3. Add to `GROQ_API_KEY`

#### Media Storage Setup

**Cloudinary**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get your cloud name, API key, and secret
3. Add to respective environment variables

</details>

### Verify Installation

```bash
# Check if everything is working
pnpm run lint          # Should pass without errors
pnpm run build         # Should build successfully
```

Open [http://localhost:3000](http://localhost:3000) to see your application running! 🎉

## 📱 PWA Installation

EduBridge works as a Progressive Web App:

1. **Desktop**: Click the install button in your browser's address bar
2. **Mobile**: Use "Add to Home Screen" from your browser menu
3. **Offline**: Access courses and content even without internet connection

## 🏗️ Project Structure

<details>
<summary>📁 Detailed Project Structure</summary>

```
edubridge/
├── 📁 app/                     # Next.js App Router (main application)
│   ├── 📁 actions/            # Server actions for data mutations
│   ├── 📁 api/                # REST API endpoints
│   │   ├── auth/              # Authentication endpoints
│   │   ├── courses/           # Course management API
│   │   ├── ai/                # AI-powered features API
│   │   └── gamification/      # Points and achievements API
│   ├── 📁 ai-tutor/           # AI tutoring chat interface
│   ├── 📁 announcements/      # Teacher announcements system
│   ├── 📁 community-forum/    # Discussion forums
│   ├── 📁 course-player/      # Interactive course content player
│   ├── 📁 courses/            # Course catalog and browsing
│   ├── 📁 create-course/      # Course creation wizard
│   ├── 📁 login/ & signup/    # Authentication pages
│   ├── 📁 onboarding/         # User role selection flow
│   ├── 📁 quiz/               # Interactive quiz system
│   ├── 📁 student*/           # Student dashboard and features
│   ├── 📁 teacher*/           # Teacher dashboard and tools
│   └── 📁 manage-course/      # Course management interface
├── 📁 components/             # Reusable React components
│   ├── 📁 gamification/       # Achievement badges, progress bars
│   ├── 📁 quiz/               # Quiz components and logic
│   ├── 📁 revision/           # AI-powered revision tools
│   └── 📁 ui/                 # Base UI components (Radix UI)
├── 📁 hooks/                  # Custom React hooks
│   ├── use-gamification.ts    # Points, streaks, achievements
│   ├── use-offline-*.ts       # PWA offline functionality
│   └── use-mobile.ts          # Mobile-responsive utilities
├── 📁 lib/                    # Core utilities and configurations
│   ├── aiClient.ts            # AI service integrations (Groq, OpenAI)
│   ├── auth.ts                # NextAuth.js configuration
│   ├── cloudinary.ts          # Media upload and management
│   ├── gamification.ts        # Gamification logic and calculations
│   ├── offline-*.ts           # Offline data synchronization
│   ├── prisma.ts              # Database client configuration
│   └── utils.ts               # General utility functions
├── 📁 prisma/                 # Database layer
│   ├── 📁 migrations/         # Database migration history
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   └── seed.ts                # Sample data seeding
├── 📁 public/                 # Static assets
│   ├── 📁 icons/              # PWA icons (various sizes)
│   ├── manifest.json          # PWA manifest configuration
│   ├── sw.js                  # Service worker for offline support
│   └── 📁 images/             # Static images and placeholders
├── 📁 styles/                 # Global CSS and Tailwind config
├── 📄 middleware.ts           # Route protection and auth middleware
├── 📄 next.config.mjs         # Next.js configuration
├── 📄 tailwind.config.js      # Tailwind CSS configuration
└── 📄 tsconfig.json           # TypeScript configuration
```

</details>

### Key Directories Explained

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js 13+ App Router - all pages and API routes |
| `components/` | Reusable UI components organized by feature |
| `lib/` | Core business logic, utilities, and configurations |
| `prisma/` | Database schema, migrations, and seeding |
| `hooks/` | Custom React hooks for shared logic |
| `public/` | Static assets, PWA files, and images |

## 🎯 Key Features Deep Dive

### Course Management
- **Rich Content Editor**: Support for multiple content types
- **Video Integration**: Upload to Cloudinary or embed YouTube videos
- **Progress Tracking**: Automatic progress calculation and completion tracking
- **Enrollment System**: Manage student enrollments and access

### AI Tutoring
- **Contextual Help**: AI understands course content and student progress
- **AI Provider**: Fallback system with Groq
- **Personalized Responses**: Tailored explanations based on learning level

### Gamification System
- **Achievement Types**: First lesson, streak milestones, quiz mastery
- **Point System**: Earn points for completing lessons and quizzes
- **Streak Tracking**: Daily activity streaks with longest streak records
- **Level Progression**: Advance through levels based on total points

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build optimized production bundle |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint for code quality checks |
| `pnpm prisma generate` | Generate Prisma client |
| `pnpm prisma db push` | Push schema changes to database |
| `pnpm prisma studio` | Open Prisma Studio (database GUI) |
| `pnpm prisma migrate dev` | Create and apply new migration |

### Development Workflow

```bash
# Daily development
pnpm dev                    # Start development server

# Database changes
pnpm prisma db push         # Quick schema updates
pnpm prisma migrate dev     # Create proper migrations

# Code quality
pnpm lint                   # Check for linting issues
pnpm build                  # Verify production build
```

## 📚 API Documentation

EduBridge provides a comprehensive REST API for all platform features:

### Authentication Endpoints
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signup` - User registration
- `GET /api/auth/session` - Get current session

### Course Management
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course
- `GET /api/courses/[id]` - Get course details
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course

### Learning & Progress
- `POST /api/progress` - Update learning progress
- `GET /api/progress/[userId]` - Get user progress
- `POST /api/quiz/attempt` - Submit quiz attempt
- `GET /api/gamification/achievements` - Get user achievements

### AI Features
- `POST /api/ai/tutor` - AI tutoring chat
- `POST /api/ai/quiz-generate` - Generate AI quiz
- `POST /api/ai/revision` - AI-powered revision


## 🔒 Security Features

- **Authentication**: Secure NextAuth.js implementation
- **Authorization**: Role-based access control (Student/Teacher)
- **Data Protection**: Input validation with Zod schemas
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Rate Limiting**: API rate limiting for abuse prevention
- **Secure Headers**: Security headers configured

## 🔧 Troubleshooting

<details>
<summary>Common Issues and Solutions</summary>

### Database Connection Issues
```bash
# Check if DATABASE_URL is correct
echo $DATABASE_URL

# Reset database connection
pnpm prisma db push --force-reset
pnpm prisma generate
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check TypeScript errors
pnpm tsc --noEmit
```

### Environment Variables Not Loading
```bash
# Ensure .env is in root directory
ls -la .env

# Restart development server after .env changes
pnpm dev
```

### AI Features Not Working
- Verify API keys are set correctly in `.env`
- Check API key permissions and quotas
- Ensure network connectivity to AI services

### PWA Not Installing
- Check if running on HTTPS (required for PWA)
- Verify `manifest.json` is accessible
- Clear browser cache and try again

</details>

### Getting Help

If you encounter issues:

1. **Check the logs** - Look at browser console and terminal output
2. **Search existing issues** - Check [GitHub Issues](https://github.com/rayshivam30/edubridge/issues)
3. **Create a new issue** - Provide detailed error messages and steps to reproduce
4. **Join our community** - Get help from other developers

## 🌐 Deployment

**Live Application**: [https://edu-bridge-lac.vercel.app/](https://edu-bridge-lac.vercel.app/)

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rayshivam30/edubridge)

**Manual Vercel Setup:**
1. Fork this repository
2. Connect to [Vercel](https://vercel.com/)
3. Import your forked repository
4. Configure environment variables in Vercel dashboard
5. Deploy automatically on push to main branch

### Alternative Deployment Options

<details>
<summary>Docker Deployment</summary>

```dockerfile
# Dockerfile (create this file)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t edubridge .
docker run -p 3000:3000 edubridge
```

</details>

<details>
<summary>Manual Server Deployment</summary>

```bash
# On your server
git clone <your-repo>
cd edubridge
pnpm install
pnpm build

# Set up environment variables
# Configure reverse proxy (nginx/apache)
# Set up process manager (PM2)
pm2 start npm --name "edubridge" -- start
```

</details>

### Environment Variables for Production

Ensure these are set in your production environment:
- All variables from `.env` example
- `NEXTAUTH_URL` should be your production domain
- Database should be production-ready (not local)

## 🤝 Contributing

We welcome contributions!

### Quick Contribution Steps

1. **Fork** the repository
2. **Clone** your fork: `git clone <your-fork-url>`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes and test them
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request with a clear description

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features when applicable
- Update documentation as needed
- Ensure CI passes before submitting PR

### Areas for Contribution

- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- 🔧 Performance optimizations
- 🌐 Internationalization (i18n)
