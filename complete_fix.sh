#!/bin/bash
#
# Easy Load & Dump - COMPLETE FIX SCRIPT
# This fixes the 404 routing issue
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Easy Load & Dump - Complete Fix                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PORT=3002
PROD_DIR="/opt/ezloadndump"
SERVICE_NAME="ezloadndump"
REPO_DIR="/home/ezloadndump"

# Stop service
echo "→ Stopping service..."
systemctl stop ${SERVICE_NAME} 2>/dev/null || true

# COMPLETELY CLEAN the production directory
echo "→ Cleaning production directory..."
rm -rf ${PROD_DIR}
mkdir -p ${PROD_DIR}

# Copy ALL files (preserving structure)
echo "→ Copying all files..."
cd ${REPO_DIR}

# Copy directories
cp -r app ${PROD_DIR}/
cp -r components ${PROD_DIR}/
cp -r lib ${PROD_DIR}/
cp -r public ${PROD_DIR}/
cp -r hooks ${PROD_DIR}/

# Copy config files
cp package.json ${PROD_DIR}/
cp yarn.lock ${PROD_DIR}/ 2>/dev/null || true
cp next.config.js ${PROD_DIR}/
cp tailwind.config.js ${PROD_DIR}/
cp postcss.config.js ${PROD_DIR}/
cp jsconfig.json ${PROD_DIR}/
cp components.json ${PROD_DIR}/

# Create .env with CORRECT domain
echo "→ Creating .env file..."
cat > ${PROD_DIR}/.env << 'ENVFILE'
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=ezloadndump

# Your domain
NEXT_PUBLIC_BASE_URL=https://ezloadndump.com

# Stripe Payment Keys (get from https://dashboard.stripe.com/apikeys)
# Secret Key - starts with sk_live_ (used on server)
STRIPE_SECRET_KEY=sk_test_placeholder
# Publishable Key - starts with pk_live_ (used on frontend if needed)
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# Email SMTP - replace with your real credentials later
SMTP_HOST=mail.ezloadndump.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@ezloadndump.com
SMTP_PASS=REPLACE_WITH_PASSWORD
EMAIL_FROM_NAME=Easy Load & Dump
EMAIL_FROM_ADDRESS=bookings@ezloadndump.com

CORS_ORIGINS=https://ezloadndump.com
ENVFILE

# Go to production directory
cd ${PROD_DIR}

# Install dependencies
echo "→ Installing dependencies..."
yarn install --production=false

# IMPORTANT: Clear any old build cache
echo "→ Clearing old build cache..."
rm -rf .next

# Build fresh
echo "→ Building application (this takes 2-3 minutes)..."
yarn build

# Check if build succeeded
if [ ! -d ".next" ]; then
    echo ""
    echo "❌ BUILD FAILED! Check the error messages above."
    exit 1
fi

echo "→ Build successful!"

# Create systemd service
echo "→ Creating service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << SERVICEFILE
[Unit]
Description=Easy Load & Dump
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

# Reload and start
echo "→ Starting service..."
systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl start ${SERVICE_NAME}

# Wait for startup
echo "→ Waiting for app to start..."
sleep 5

# Test
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TESTING..."
echo "═══════════════════════════════════════════════════════════════"

# Check service status
if systemctl is-active --quiet ${SERVICE_NAME}; then
    echo "✅ Service is running"
else
    echo "❌ Service failed to start"
    echo "Logs:"
    journalctl -u ${SERVICE_NAME} -n 20 --no-pager
    exit 1
fi

# Test local connection
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PORT}/ 2>/dev/null || echo "000")
echo "Local HTTP test: ${HTTP_CODE}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ App is responding with 200 OK!"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  App responding with 404 - routing issue"
else
    echo "⚠️  HTTP code: ${HTTP_CODE}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    DEPLOYMENT COMPLETE                         "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Your .htaccess should contain:"
echo ""
echo "  RewriteEngine On"
echo "  RewriteRule ^(.*)\$ http://127.0.0.1:${PORT}/\$1 [P,L]"
echo ""
echo "Test your site: https://ezloadndump.com"
echo ""
