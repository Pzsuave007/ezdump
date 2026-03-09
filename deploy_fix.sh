#!/bin/bash
#
# Easy Load & Dump - Deployment Fix Script
# Run this from /home/ezloadndump (where you cloned the repo)
#
# Usage: chmod +x deploy_fix.sh && sudo ./deploy_fix.sh
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Easy Load & Dump - Deployment Fix                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PORT=3002
PROD_DIR="/opt/ezloadndump"
SERVICE_NAME="ezloadndump"

# Stop existing service if running
echo "→ Stopping service..."
systemctl stop ${SERVICE_NAME} 2>/dev/null || true

# Create production directory
echo "→ Creating directories..."
mkdir -p ${PROD_DIR}

# Copy all files to production directory
echo "→ Copying files..."
cp -r app ${PROD_DIR}/
cp -r components ${PROD_DIR}/
cp -r lib ${PROD_DIR}/
cp -r public ${PROD_DIR}/
cp -r hooks ${PROD_DIR}/
cp package.json ${PROD_DIR}/
cp yarn.lock ${PROD_DIR}/ 2>/dev/null || true
cp next.config.js ${PROD_DIR}/
cp tailwind.config.js ${PROD_DIR}/
cp postcss.config.js ${PROD_DIR}/
cp jsconfig.json ${PROD_DIR}/
cp components.json ${PROD_DIR}/

# CREATE THE .ENV FILE - THIS IS THE KEY FIX
echo "→ Creating .env file..."
cat > ${PROD_DIR}/.env << 'ENVFILE'
# ============================================
# DATABASE
# ============================================
MONGO_URL=mongodb://localhost:27017
DB_NAME=ezloadndump

# ============================================
# APPLICATION URL (Your domain)
# ============================================
NEXT_PUBLIC_BASE_URL=https://ezloadndump.com

# ============================================
# STRIPE PAYMENTS
# ============================================
# Get your key from: https://dashboard.stripe.com/apikeys
# Replace with your live key (starts with sk_live_)
STRIPE_API_KEY=sk_test_placeholder

# ============================================
# EMAIL SMTP SETTINGS
# ============================================
# Update these with your email server details
SMTP_HOST=mail.ezloadndump.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@ezloadndump.com
SMTP_PASS=REPLACE_WITH_YOUR_PASSWORD
EMAIL_FROM_NAME=Easy Load & Dump
EMAIL_FROM_ADDRESS=bookings@ezloadndump.com

# ============================================
# CORS
# ============================================
CORS_ORIGINS=https://ezloadndump.com
ENVFILE

# Install dependencies
echo "→ Installing dependencies..."
cd ${PROD_DIR}
yarn install --production=false

# Build the application
echo "→ Building application (this may take a few minutes)..."
yarn build

# Create systemd service
echo "→ Creating service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << SERVICEFILE
[Unit]
Description=Easy Load & Dump - Dump Trailer Rental
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=${PROD_DIR}
ExecStart=/usr/bin/yarn start -p ${PORT}
Restart=always
RestartSec=10
EnvironmentFile=${PROD_DIR}/.env
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEFILE

# Reload and start service
echo "→ Starting service..."
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl start ${SERVICE_NAME}

# Wait a moment for service to start
sleep 3

# Check if it's running
echo ""
echo "═══════════════════════════════════════════════════════════════"
if systemctl is-active --quiet ${SERVICE_NAME}; then
    echo "✅ SUCCESS! Service is running!"
    echo ""
    echo "Testing local connection..."
    curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" http://127.0.0.1:${PORT}/ || echo "   (waiting for app to fully start)"
else
    echo "❌ Service failed to start. Check logs:"
    echo "   journalctl -u ${SERVICE_NAME} -n 50"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Make sure your .htaccess file contains:"
echo "   ─────────────────────────────────────"
echo "   RewriteEngine On"
echo "   RewriteRule ^(.*)\$ http://127.0.0.1:${PORT}/\$1 [P,L]"
echo "   ─────────────────────────────────────"
echo ""
echo "2. Update your API keys in: ${PROD_DIR}/.env"
echo "   - STRIPE_API_KEY (get from Stripe Dashboard)"
echo "   - SMTP_PASS (your email password)"
echo ""
echo "3. After editing .env, restart:"
echo "   sudo systemctl restart ${SERVICE_NAME}"
echo ""
echo "📊 Useful commands:"
echo "   Status: sudo systemctl status ${SERVICE_NAME}"
echo "   Logs:   journalctl -u ${SERVICE_NAME} -f"
echo "   Test:   curl http://127.0.0.1:${PORT}/"
echo ""
