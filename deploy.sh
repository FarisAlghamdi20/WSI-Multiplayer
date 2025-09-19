#!/bin/bash

# Railway Deployment Script for "من قالها؟" Game
# This script helps prepare your project for Railway deployment

echo "🎮 Preparing 'من قالها؟' game for Railway deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
    echo "✅ Git repository initialized"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for required files
echo "🔍 Checking required files..."

required_files=("server.js" "package.json" "railway.json" "Procfile" ".gitignore")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing!"
    fi
done

# Add all files to git
echo "📝 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Prepare for Railway deployment - $(date)"

echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Go to https://railway.app"
echo "3. Create new project from GitHub repo"
echo "4. Deploy and enjoy your game!"
echo ""
echo "📖 For detailed instructions, see RAILWAY_DEPLOYMENT.md"
