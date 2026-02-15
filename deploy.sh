#!/bin/bash

# Backend Deployment Script for Vultr VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Restart application
echo "♻️  Restarting application..."
pm2 restart homescreen-api || pm2 start src/server.js --name homescreen-api

# Save PM2 state
pm2 save

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 Recent logs:"
pm2 logs homescreen-api --lines 20 --nostream
