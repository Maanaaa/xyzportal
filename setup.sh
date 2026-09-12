#!/bin/bash
set -e

echo "🚀 XYZ Portal Setup"
echo "=================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Local dev: npm run dev"
echo "  2. Docker:    docker-compose up -d"
echo "  3. Production: Deploy with docker-compose on your VPS"
echo ""
echo "📝 Remember to:"
echo "  - Update apps.json with your applications"
echo "  - Configure Nginx with SSL and auth"
echo "  - Update nginx.conf with your domain"
echo ""
