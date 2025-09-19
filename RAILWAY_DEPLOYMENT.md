# Railway Deployment Guide for "من قالها؟" (Who Said It?) Game

This guide will help you deploy your Arabic multiplayer trivia game to Railway.app.

## 📋 Prerequisites

Before starting, make sure you have:
- [ ] A GitHub account
- [ ] Your game code committed to a GitHub repository
- [ ] A Railway account (free at [railway.app](https://railway.app))

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Verify these files are in your repository**:
   - ✅ `package.json` (updated with production settings)
   - ✅ `server.js` (your main application file)
   - ✅ `railway.json` (Railway configuration)
   - ✅ `Procfile` (start command)
   - ✅ `.gitignore` (excludes unnecessary files)
   - ✅ `env.example` (environment variables template)

### Step 2: Create Railway Account & Project

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/Login** using your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository** from the list

### Step 3: Configure Your Deployment

1. **Railway will auto-detect** your Node.js application
2. **Set Environment Variables** (if needed):
   - Go to your project dashboard
   - Click on "Variables" tab
   - Add any custom variables from `env.example`:
     ```
     NODE_ENV=production
     MAX_PLAYERS_PER_GAME=8
     DEFAULT_QUESTION_TIMER=15
     DEFAULT_TOTAL_ROUNDS=10
     CORS_ORIGIN=*
     ```

### Step 4: Deploy & Test

1. **Railway will automatically deploy** your application
2. **Wait for deployment** to complete (usually 2-3 minutes)
3. **Get your app URL** from the deployment logs
4. **Test your game** by visiting the URL

## 🔧 Configuration Details

### Railway Configuration Files

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `Procfile`
```
web: npm start
```

### Environment Variables

Your app uses these environment variables:
- `PORT`: Server port (automatically set by Railway)
- `NODE_ENV`: Environment mode (set to 'production')
- `CORS_ORIGIN`: CORS settings (default: "*")

## 🌐 Custom Domain Setup

1. **In Railway Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Generate Domain" or add custom domain

2. **For Custom Domain**:
   - Add your domain in Railway
   - Update DNS records as instructed
   - SSL certificate is automatically provided

## 📊 Monitoring & Logs

1. **View Logs**:
   - Go to your project dashboard
   - Click "Deployments" tab
   - Click on latest deployment to view logs

2. **Monitor Usage**:
   - Check "Usage" tab for resource consumption
   - Monitor within free tier limits ($5/month credit)

## 🔄 Updates & Redeployment

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update game features"
   git push origin main
   ```

2. **Railway auto-deploys** when you push to main branch

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures
- **Check Node.js version**: Ensure `engines` in package.json matches Railway's Node.js version
- **Verify dependencies**: Make sure all dependencies are in `dependencies`, not `devDependencies`

#### 2. Application Won't Start
- **Check PORT**: Railway sets `PORT` environment variable automatically
- **Verify start command**: Should be `npm start` in Procfile
- **Check logs**: Look for error messages in Railway deployment logs

#### 3. WebSocket Connection Issues
- **CORS Settings**: Verify `CORS_ORIGIN` is set correctly
- **Network Issues**: Railway supports WebSockets by default

### Debugging Steps

1. **Check Railway Logs**:
   ```
   Project Dashboard → Deployments → Latest Deployment → Logs
   ```

2. **Test Locally**:
   ```bash
   npm install
   npm start
   ```

3. **Verify Environment Variables**:
   - Check Railway dashboard for correct variable values

## 💰 Cost Management

### Free Tier Limits
- **$5/month in credits**
- **500 hours of usage**
- **1GB RAM, 1 CPU**

### Monitoring Usage
1. **Check Usage Tab** in Railway dashboard
2. **Monitor resource consumption**
3. **Upgrade plan** if needed for higher traffic

## 🚀 Scaling Your Application

### Upgrade Options
1. **Hobby Plan**: $5/month + usage
2. **Pro Plan**: $20/month + usage
3. **Team Plan**: $99/month + usage

### Performance Optimization
1. **Add Database**: Use Railway PostgreSQL addon
2. **Implement Caching**: Add Redis for session storage
3. **CDN**: Use Railway's built-in CDN for static assets

## 📱 Mobile Optimization

Your game is already mobile-optimized with:
- ✅ Responsive design
- ✅ Touch-friendly interface
- ✅ Mobile viewport settings

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Configure appropriately for production
3. **Rate Limiting**: Consider adding rate limiting for API endpoints
4. **HTTPS**: Automatically provided by Railway

## 📞 Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Create issues in your repository

## 🎯 Next Steps After Deployment

1. **Share your game URL** with friends
2. **Monitor player feedback**
3. **Add analytics** (Google Analytics)
4. **Implement user accounts**
5. **Add more question categories**
6. **Create tournaments**

---

**Your Arabic multiplayer trivia game "من قالها؟" is now ready to be deployed on Railway! 🎮**
