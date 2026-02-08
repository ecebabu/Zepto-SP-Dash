# RDash Deployment Guide - Render.com

## 🚀 Quick Deployment Steps

Your GitHub repository: **https://github.com/ecebabu/Zepto-SP-Dash**

### Step 1: Verify GitHub Repository

✅ Ensure all files are pushed:
```bash
cd "c:\Users\babub\OneDrive\Desktop\XIOR Technology\External-Work\RDash\RDash"
git status
git add .
git commit -m "Production-ready deployment"
git push origin main
```

### Step 2: Deploy to Render.com

#### Option A: Blueprint Deployment (Recommended - Automated)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in with your GitHub account

2. **Create New Blueprint**
   - Click **"New"** → **"Blueprint"**
   - Select **"Connect a repository"**
   - Choose: `ecebabu/Zepto-SP-Dash`
   - Click **"Connect"**

3. **Render Auto-Configuration**
   Render will automatically detect `render.yaml` and create:
   - ✅ PostgreSQL Database (`rdash-db`)
   - ✅ Backend API Service (`rdash-backend`)
   - ✅ Frontend Static Site (`rdash-frontend`)

4. **Wait for Deployment**
   - PostgreSQL: ~2-3 minutes
   - Backend: ~5-7 minutes (Docker build)
   - Frontend: ~3-5 minutes (Angular build)

#### Option B: Manual Deployment (If Blueprint Fails)

**1. Create PostgreSQL Database**
- Click **"New"** → **"PostgreSQL"**
- Name: `rdash-db`
- Database: `rdash`
- User: `rdash_user`
- Region: Choose closest to you
- Plan: **Free**
- Click **"Create Database"**
- **Copy the Internal Database URL** (starts with `postgresql://`)

**2. Create Backend Service**
- Click **"New"** → **"Web Service"**
- Connect repository: `ecebabu/Zepto-SP-Dash`
- Name: `rdash-backend`
- Region: Same as database
- Branch: `main`
- Root Directory: `RDash`
- Runtime: **Docker**
- Plan: **Free**
- Environment Variables:
  ```
  DATABASE_URL=<paste-internal-database-url>
  DB_TYPE=pgsql
  JWT_SECRET=<generate-random-string-min-32-chars>
  SESSION_LIFETIME=14400
  ALLOWED_ORIGINS=https://rdash-frontend.onrender.com
  APP_ENV=production
  DEBUG_MODE=false
  MAX_UPLOAD_SIZE=10485760
  UPLOAD_PATH=/tmp/uploads
  ```
- Click **"Create Web Service"**

**3. Create Frontend Service**
- Click **"New"** → **"Static Site"**
- Connect repository: `ecebabu/Zepto-SP-Dash`
- Name: `rdash-frontend`
- Branch: `main`
- Root Directory: `RDash`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist/rdash/browser`
- Click **"Create Static Site"**

### Step 3: Configure Frontend API URL

After backend deploys, you'll get a URL like: `https://rdash-backend.onrender.com`

1. **Update Environment File**
   Edit `src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://rdash-backend.onrender.com'  // Your actual backend URL
   };
   ```

2. **Commit and Push**
   ```bash
   git add src/environments/environment.prod.ts
   git commit -m "Update production API URL"
   git push origin main
   ```
   
   Frontend will automatically redeploy.

### Step 4: Update Backend CORS

In Render Dashboard → Backend Service → Environment:
- Update `ALLOWED_ORIGINS` to: `https://rdash-frontend.onrender.com` (your actual frontend URL)
- Click **"Save Changes"**
- Backend will redeploy automatically

### Step 5: Initialize Database

The database tables will be created automatically on first backend startup via the `createTables()` method in `route.php`.

### Step 6: Access Your Application

1. **Frontend URL**: `https://rdash-frontend.onrender.com`
2. **Backend API**: `https://rdash-backend.onrender.com`

**Default Login**:
- Email: `admin@example.com`
- Password: `adminpass`

⚠️ **IMPORTANT**: Change the password immediately after first login!

---

## 🔧 Environment Variables Reference

### Backend Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | From Render PostgreSQL | Internal database connection |
| `DB_TYPE` | `pgsql` | Database type |
| `JWT_SECRET` | Random 32+ chars | Secret for JWT tokens |
| `SESSION_LIFETIME` | `14400` | Session duration (4 hours) |
| `ALLOWED_ORIGINS` | Frontend URL | CORS allowed origins |
| `APP_ENV` | `production` | Application environment |
| `DEBUG_MODE` | `false` | Disable debug in production |
| `MAX_UPLOAD_SIZE` | `10485760` | Max upload (10MB) |
| `UPLOAD_PATH` | `/tmp/uploads` | Upload directory |

### Generate Secure JWT_SECRET

```bash
# On Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use online generator
# https://randomkeygen.com/ (CodeIgniter Encryption Keys)
```

---

## 🐛 Troubleshooting

### Frontend Build Fails

**Error**: `Budget exceeded`
**Solution**: Already configured in `angular.json` with increased budgets

**Error**: `Cannot find module`
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend Won't Start

**Error**: `Database connection failed`
**Solution**: 
- Verify `DATABASE_URL` is the **Internal Database URL** from Render
- Format: `postgresql://user:pass@host:port/dbname`

**Error**: `CORS error`
**Solution**: 
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- No trailing slashes in URLs

### Database Tables Not Created

**Solution**: 
- Check backend logs in Render Dashboard
- Tables are auto-created on first API request
- Verify PostgreSQL service is running

### Free Tier Limitations

- **Backend**: Spins down after 15 minutes of inactivity
- **First request**: May take 30-60 seconds (cold start)
- **Database**: 1GB storage limit
- **Bandwidth**: 100GB/month

---

## 🔒 Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Verify `ALLOWED_ORIGINS` is set correctly
- [ ] Ensure `DEBUG_MODE=false`
- [ ] Review all environment variables
- [ ] Test login/logout functionality
- [ ] Test CORS from frontend domain
- [ ] Verify HTTPS is enforced
- [ ] Check database connection is secure

---

## 📊 Monitoring

### Render Dashboard

- **Logs**: View real-time logs for each service
- **Metrics**: CPU, memory, and bandwidth usage
- **Events**: Deployment history and status
- **Shell**: Access service shell for debugging

### Health Checks

- Frontend: `https://rdash-frontend.onrender.com`
- Backend: `https://rdash-backend.onrender.com/health` (if implemented)

---

## 🔄 Updating Your Application

### Code Updates

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically:
1. Detect the push
2. Rebuild affected services
3. Deploy new version

### Environment Variable Updates

1. Go to Render Dashboard
2. Select your service
3. Go to **Environment** tab
4. Update variables
5. Click **Save Changes**
6. Service will redeploy automatically

---

## 💡 Tips for Success

1. **Monitor First Deployment**: Watch logs in Render Dashboard
2. **Test Thoroughly**: Test all features after deployment
3. **Keep Secrets Safe**: Never commit `.env` to GitHub
4. **Use Internal URLs**: Backend should use internal database URL
5. **CORS Configuration**: Must match exactly (no trailing slashes)
6. **Cold Starts**: First request after inactivity takes longer
7. **Logs Are Your Friend**: Check logs for any issues

---

## 🎉 You're Ready!

Your RDash application is configured for production deployment on Render.com's free tier. Follow the steps above, and you'll have a live application in about 15-20 minutes!

**Need Help?**
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: https://github.com/ecebabu/Zepto-SP-Dash/issues

Good luck with your deployment! 🚀
