# Deployment Guide

This guide explains how to deploy your Online Medication application to production.

## Overview

Your application consists of two parts:
1. **Frontend** (HTML, CSS, JavaScript) - Deployed on Netlify
2. **Backend** (Flask API) - Needs to be deployed separately

## Important: Backend Deployment Required

**The frontend cannot work without a deployed backend!** The error "Failed to connect to server" occurs because:
- Netlify only hosts static files (HTML, CSS, JS)
- Your Flask backend needs to be deployed on a platform that supports Python
- The frontend is trying to connect to `localhost:5000`, which doesn't exist in production

## Step 1: Deploy the Backend

You need to deploy your Flask backend to one of these platforms:

### Option A: Heroku (Recommended for beginners)

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Create a `Procfile`** in the `backend` directory:
   ```
   web: gunicorn app:app
   ```

3. **Update `requirements.txt`** to include:
   ```
   gunicorn
   ```

4. **Deploy to Heroku**:
   ```bash
   cd backend
   heroku login
   heroku create your-app-name
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-app-name
   git push heroku main
   ```

5. **Get your backend URL**: `https://your-app-name.herokuapp.com`

### Option B: Railway

1. Go to https://railway.app
2. Create a new project
3. Connect your GitHub repository
4. Select the `backend` folder
5. Railway will auto-detect Python and deploy
6. Get your backend URL from Railway dashboard

### Option C: Render

1. Go to https://render.com
2. Create a new Web Service
3. Connect your repository
4. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. Get your backend URL from Render dashboard

## Step 2: Configure Frontend API URL

After deploying your backend, you need to update the frontend to use your backend URL:

1. **Open `config.js`** in the root directory

2. **Update the production API URL**:
   ```javascript
   const API_BASE_URL = isDevelopment 
       ? 'http://localhost:5000' 
       : 'https://your-backend-url.herokuapp.com'; // Replace with your actual backend URL
   ```

   Replace `https://your-backend-url.herokuapp.com` with your actual backend URL (from Heroku, Railway, or Render).

## Step 3: Deploy Frontend to Netlify

### Method 1: Via Netlify Dashboard

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure build settings:
   - **Build command**: (leave empty - no build needed)
   - **Publish directory**: `.` (root directory)
5. Click "Deploy site"

### Method 2: Via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify login
   netlify deploy --prod
   ```

## Step 4: Configure CORS on Backend

Make sure your backend allows requests from your Netlify domain:

In `backend/app.py`, update the CORS configuration:

```python
from flask_cors import CORS

# Allow requests from your Netlify domain
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://your-netlify-app.netlify.app",
            "http://localhost:5501",  # For local development
            "http://localhost:3000"   # If using a local dev server
        ]
    }
})
```

Or allow all origins (for development only):
```python
CORS(app)  # This already allows all origins
```

## Step 5: Environment Variables (Optional)

If you need different API URLs for different environments, you can use Netlify's environment variables:

1. In Netlify dashboard → Site settings → Environment variables
2. Add: `API_BASE_URL` = `https://your-backend-url.herokuapp.com`
3. Update `config.js` to read from environment:
   ```javascript
   const API_BASE_URL = isDevelopment 
       ? 'http://localhost:5000' 
       : (window.API_BASE_URL || process.env.API_BASE_URL || 'https://your-backend-url.herokuapp.com');
   ```

## Troubleshooting

### "Failed to connect to server" Error

1. **Check backend is deployed**: Visit `https://your-backend-url.herokuapp.com/api/health` - it should return `{"status": "healthy"}`
2. **Check API URL in config.js**: Make sure it matches your backend URL
3. **Check CORS settings**: Backend must allow requests from your Netlify domain
4. **Check browser console**: Look for CORS errors or network errors

### Backend Not Responding

1. Check backend logs (Heroku: `heroku logs --tail`)
2. Ensure database is initialized
3. Check if backend is running (visit health endpoint)

### CORS Errors

1. Update CORS settings in `backend/app.py` to include your Netlify domain
2. Ensure backend is using `flask-cors` package

## Testing

1. **Test locally**:
   - Start backend: `cd backend && python app.py`
   - Open `index.html` in browser
   - Should connect to `http://localhost:5000`

2. **Test production**:
   - Visit your Netlify URL
   - Try creating an account
   - Check browser console for errors

## Summary

1. ✅ Deploy backend (Heroku/Railway/Render)
2. ✅ Update `config.js` with backend URL
3. ✅ Deploy frontend to Netlify
4. ✅ Configure CORS on backend
5. ✅ Test the application

Your application should now work in production! 🎉

