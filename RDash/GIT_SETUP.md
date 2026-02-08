# Git Setup and Deployment Guide

## 📦 Step 1: Initialize Git Repository (If Not Already Done)

```bash
cd "c:\Users\babub\OneDrive\Desktop\XIOR Technology\External-Work\RDash\RDash"

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Production-ready RDash application"
```

## 🌐 Step 2: Create GitHub Repository

### Option A: Via GitHub Website (Recommended)

1. Go to: https://github.com/new
2. Repository name: `Zepto-SP-Dash`
3. Description: `Store Project Management System - Track retail store development projects`
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **"Create repository"**

### Option B: Via GitHub CLI (If Installed)

```bash
gh repo create Zepto-SP-Dash --private --source=. --remote=origin --push
```

## 🔗 Step 3: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Use these commands:

```bash
# Add remote origin (replace with your actual URL)
git remote add origin https://github.com/ecebabu/Zepto-SP-Dash.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## ✅ Step 4: Verify Files Are Pushed

Visit: https://github.com/ecebabu/Zepto-SP-Dash

You should see:
- ✅ `README.md`
- ✅ `render.yaml`
- ✅ `Dockerfile`
- ✅ `.env.example`
- ✅ `src/` directory
- ✅ `server/` directory
- ✅ `package.json`

## 🚀 Step 5: Deploy to Render.com

Now follow the **DEPLOYMENT.md** guide to deploy to Render.com!

---

## 🔐 Important: Before Pushing

Make sure `.env` is in `.gitignore` (already configured):

```bash
# Check .gitignore includes .env
cat .gitignore | grep ".env"
```

**Never commit sensitive data like:**
- ❌ `.env` file
- ❌ Database files (`*.db`, `*.sqlite`)
- ❌ `node_modules/`
- ❌ `dist/` build folder

All these are already in `.gitignore` ✅

---

## 📝 Quick Commands Reference

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline -10
```

---

## 🆘 Troubleshooting

### "Repository not found"
- Ensure repository is created on GitHub first
- Check remote URL: `git remote -v`
- Verify you're logged in to correct GitHub account

### "Permission denied"
- Set up SSH keys or use HTTPS with personal access token
- GitHub Settings → Developer Settings → Personal Access Tokens

### "Large files rejected"
- Check if `node_modules/` is being pushed (should be in `.gitignore`)
- Remove from git: `git rm -r --cached node_modules/`

---

## ✨ Next Steps

1. ✅ Create GitHub repository
2. ✅ Push code to GitHub
3. ✅ Follow **DEPLOYMENT.md** for Render.com deployment
4. ✅ Update frontend API URL after backend deploys
5. ✅ Test your live application!

Good luck! 🚀
