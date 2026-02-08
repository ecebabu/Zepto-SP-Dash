# RDash - Store Project Management System

A comprehensive, production-ready project management system for tracking retail store development projects from initial survey to launch. Built with Angular 18 and PHP 8.3, featuring full responsive design and PostgreSQL support.

## 🎯 Features

- **Project Lifecycle Tracking**: Monitor projects through LL WIP, Fitout WIP, and Completed stages
- **Task Management**: Detailed construction progress tracking with status updates
- **Role-Based Access Control**: Multiple user roles (Super Admin, Admin, Editor, Ground Team, Associate)
- **Media Documentation**: Upload and manage photos/videos for visual progress tracking
- **Interactive Dashboard**: Real-time project health monitoring with statistics
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Secure Authentication**: JWT-based authentication with session management

## 🛠️ Tech Stack

- **Frontend**: Angular 18 with standalone components
- **Backend**: PHP 8.3 with PDO
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Styling**: Responsive CSS with mobile-first approach
- **Deployment**: Docker + Render.com ready

## 📋 Prerequisites

- Node.js 18+ and npm
- PHP 8.3+ with PDO extensions (pdo_pgsql for production, pdo_sqlite for development)
- PostgreSQL 14+ (for production deployment)
- Git

## 🚀 Quick Start

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd RDash/RDash
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   
   **Frontend** (runs on http://localhost:4200):
   ```bash
   npm start
   ```
   
   **Backend** (runs on http://localhost:8000):
   ```bash
   cd server
   php -S localhost:8000 route.php
   ```

5. **Access the application**
   - Open http://localhost:4200 in your browser
   - Default login credentials:
     - Email: `admin@example.com`
     - Password: `adminpass`
   - **⚠️ IMPORTANT: Change the default password immediately after first login!**

## 🌐 Production Deployment (Render.com)

### Prerequisites
- GitHub account with your code pushed
- Render.com account (free tier available)

### Automated Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy via Render Blueprint**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create:
     - PostgreSQL database
     - Backend API service (Docker)
     - Frontend static site

3. **Update Frontend API URL**
   
   After backend deploys, update `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://your-backend-url.onrender.com'
   };
   ```
   
   Commit and push to trigger redeployment.

4. **Configure CORS**
   
   Update backend environment variable `ALLOWED_ORIGINS` to include your frontend URL:
   ```
   ALLOWED_ORIGINS=https://your-frontend.onrender.com
   ```

### Manual Deployment

If blueprint doesn't work, follow the manual setup in the deployment guide below.

## 📁 Project Structure

```
RDash/
├── RDash/                      # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # UI components (login, dashboard, etc.)
│   │   │   ├── Services/       # API services
│   │   │   └── modules/        # Feature modules
│   │   ├── environments/       # Environment configs (dev/prod)
│   │   └── styles.css          # Global responsive styles
│   ├── server/                 # PHP backend
│   │   ├── route.php          # Main API router
│   │   ├── config.php         # Environment configuration
│   │   ├── schema.sql         # PostgreSQL schema
│   │   └── dbo/               # SQLite database (dev only)
│   ├── .env.example           # Environment variables template
│   ├── Dockerfile             # Backend container config
│   ├── render.yaml            # Render.com deployment config
│   └── README.md              # This file
```

## ⚙️ Environment Variables

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Production |
| `DB_TYPE` | Database type (`pgsql` or `sqlite`) | `pgsql` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `SESSION_LIFETIME` | Session duration in seconds | `14400` | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | - | Yes |
| `APP_ENV` | Application environment (`production` or `development`) | `production` | Yes |
| `DEBUG_MODE` | Enable debug mode (`true` or `false`) | `false` | No |
| `MAX_UPLOAD_SIZE` | Maximum upload size in bytes | `10485760` | No |
| `UPLOAD_PATH` | Upload directory path | `/tmp/uploads` | No |

### Frontend (src/environments/)

**Development** (`environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};
```

**Production** (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-url.onrender.com'
};
```

## 🔒 Security Features

- **HTTPS Enforced**: All production traffic uses HTTPS
- **CORS Protection**: Configurable allowed origins
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password storage
- **SQL Injection Protection**: Prepared statements throughout
- **XSS Protection**: Security headers (X-Frame-Options, CSP, etc.)
- **Input Validation**: Server-side validation for all inputs
- **Environment Variables**: Sensitive data stored in .env (not in git)

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-first CSS**: Optimized for mobile devices
- **Touch-friendly**: 44px minimum touch targets
- **Fluid Typography**: Scales automatically with clamp()
- **Responsive Tables**: Card layout on mobile, table on desktop
- **Flexible Grids**: 1-6 column layouts based on screen size

**Breakpoints**:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

## 🧪 Testing

### Local Testing
```bash
# Run development server
npm start

# Build for production
npm run build --configuration=production

# Test production build locally
npx http-server dist/rdash/browser
```

### Database Testing

**SQLite (Development)**:
```bash
cd server
php -S localhost:8000 route.php
# Uses server/dbo/data/app.db
```

**PostgreSQL (Production-like)**:
```bash
# Set environment variables
export DB_TYPE=pgsql
export DATABASE_URL=postgresql://user:pass@localhost:5432/rdash

cd server
php -S localhost:8000 route.php
```

## 🐛 Troubleshooting

### Backend Won't Start
- Check PHP version: `php -v` (should be 8.3+)
- Verify PDO extensions: `php -m | grep pdo`
- Check error logs in terminal

### Frontend Build Errors
- Clear cache: `rm -rf node_modules dist .angular && npm install`
- Check Node version: `node -v` (should be 18+)

### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
- Check PostgreSQL is running
- Ensure PDO PostgreSQL extension is enabled

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check browser console for specific error
- Ensure no trailing slashes in URLs

## 📚 API Documentation

### Authentication
- `POST /login` - User login
- `POST /logout` - User logout

### Projects
- `GET /projects` - List all projects
- `GET /projects/:id` - Get project details
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Users (Admin only)
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Tasks
- `GET /tasks` - List all tasks
- `GET /tasks/:id` - Get task details
- `POST /tasks` - Create new task
- `PUT /tasks/:id` - Update task

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues, questions, or support:
- Create an issue in the GitHub repository
- Contact: support@zepto.com

## 🎉 Acknowledgments

- Angular team for the amazing framework
- Render.com for easy deployment
- All contributors and testers

---

**Made with ❤️ for efficient project management**
