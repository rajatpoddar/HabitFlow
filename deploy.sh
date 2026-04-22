#!/bin/bash

# HabitFlow Deployment Script
# Usage: ./deploy.sh [--no-build]

set -e

echo "🌿 HabitFlow Deployment Script"
echo "================================"
echo ""

# Check if .env or .env.local exists
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo "❌ Error: Neither .env nor .env.local file found!"
    echo "Please create .env with required environment variables."
    echo "See .env.example for reference."
    exit 1
fi

# Use .env if it exists, otherwise use .env.local
ENV_FILE=".env"
if [ ! -f ".env" ] && [ -f ".env.local" ]; then
    echo "⚠️  Warning: .env not found, but .env.local exists."
    echo "Docker Compose expects .env by default."
    echo ""
    echo "Creating symlink: .env -> .env.local"
    ln -sf .env.local .env
    ENV_FILE=".env.local"
fi

echo "📄 Using environment file: $ENV_FILE"
echo ""

# Check if VAPID keys are configured
if ! grep -q "NEXT_PUBLIC_VAPID_PUBLIC_KEY=" "$ENV_FILE" || \
   ! grep -q "VAPID_PRIVATE_KEY=" "$ENV_FILE"; then
    echo "⚠️  Warning: VAPID keys not found in $ENV_FILE"
    echo "Notifications will not work without VAPID keys."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Parse arguments
NO_BUILD=false
if [ "$1" == "--no-build" ]; then
    NO_BUILD=true
fi

# Stop existing container
echo "🛑 Stopping existing container..."
sudo docker-compose down

# Build and start
if [ "$NO_BUILD" = true ]; then
    echo "🚀 Starting container (no rebuild)..."
    sudo docker-compose up -d
else
    echo "🔨 Building and starting container..."
    sudo docker-compose up -d --build
fi

# Wait for container to be healthy
echo ""
echo "⏳ Waiting for container to be healthy..."
sleep 5

# Check if container is running
if sudo docker-compose ps | grep -q "Up"; then
    echo "✅ Container is running!"
else
    echo "❌ Container failed to start. Check logs:"
    sudo docker-compose logs --tail=50
    exit 1
fi

# Health check
echo ""
echo "🏥 Running health check..."
HEALTH_URL="http://localhost:3847/api/health"

if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed. Container may still be starting..."
fi

# Verify environment variables
echo ""
echo "🔍 Verifying environment variables..."
if sudo docker exec habitflow_app env | grep -q "NEXT_PUBLIC_VAPID_PUBLIC_KEY="; then
    echo "✅ VAPID keys configured"
else
    echo "❌ VAPID keys NOT configured!"
    echo "Check your .env file and rebuild."
fi

# Show logs
echo ""
echo "📋 Recent logs:"
sudo docker-compose logs --tail=20

echo ""
echo "================================"
echo "✅ Deployment complete!"
echo ""
echo "📍 App URL: https://habit.palojori.in"
echo "🐛 Debug: https://habit.palojori.in/debug-pwa"
echo ""
echo "Useful commands:"
echo "  View logs:    sudo docker-compose logs -f"
echo "  Restart:      sudo docker-compose restart"
echo "  Stop:         sudo docker-compose down"
echo "  Shell access: sudo docker exec -it habitflow_app sh"
echo "  Check env:    sudo docker exec habitflow_app env | grep VAPID"
echo ""
