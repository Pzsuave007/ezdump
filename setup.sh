#!/bin/bash
#
# Easy Load & Dump - One Command Server Setup
# For GoDaddy VPS (AlmaLinux 9 + cPanel + Apache)
#
# Usage: 
#   chmod +x setup.sh && ./setup.sh
#   OR
#   curl -sSL [URL]/setup.sh | bash
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          Easy Load & Dump - Server Setup Script               ║"
echo "║              GoDaddy VPS / AlmaLinux 9 / Apache               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# STEP 1: Find Available Port
# ============================================
echo -e "${YELLOW}Step 1: Finding available port...${NC}"

# Get list of used ports
USED_PORTS=$(netstat -tuln 2>/dev/null | grep LISTEN | awk '{print $4}' | grep -oE '[0-9]+$' | sort -n | uniq)

# Find first available port starting from 3001
PORT=3001
while echo "$USED_PORTS" | grep -q "^${PORT}$"; do
    PORT=$((PORT + 1))
    if [ $PORT -gt 9999 ]; then
        echo -e "${RED}Error: No available ports found between 3001-9999${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Found available port: ${PORT}${NC}"
echo ""

# ============================================
# STEP 2: Set Variables
# ============================================
PROJECT_NAME="ezloadndump"
GIT_DIR="/home/${PROJECT_NAME}"
PROD_DIR="/opt/${PROJECT_NAME}"
SERVICE_FILE="/etc/systemd/system/${PROJECT_NAME}.service"

echo -e "${YELLOW}Step 2: Configuration${NC}"
echo "  Project Name: ${PROJECT_NAME}"
echo "  Git Directory: ${GIT_DIR}"
echo "  Production Directory: ${PROD_DIR}"
echo "  Service Port: ${PORT}"
echo ""

# ============================================
# STEP 3: Create Directories
# ============================================
echo -e "${YELLOW}Step 3: Creating directories...${NC}"

mkdir -p ${GIT_DIR}
mkdir -p ${PROD_DIR}
mkdir -p ${PROD_DIR}/public

echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# ============================================
# STEP 4: Copy Application Files
# ============================================
echo -e "${YELLOW}Step 4: Copying application files...${NC}"

# If running from the app directory, copy files
if [ -d "./app" ]; then
    cp -r ./app/* ${PROD_DIR}/
elif [ -d "../app" ]; then
    cp -r ../app/* ${PROD_DIR}/
elif [ -f "./package.json" ]; then
    cp -r ./* ${PROD_DIR}/
fi

# Copy public files (logo, etc)
if [ -d "./public" ]; then
    cp -r ./public/* ${PROD_DIR}/public/
fi

echo -e "${GREEN}✓ Files copied${NC}"
echo ""

# ============================================
# STEP 5: Create Environment File
# ============================================
echo -e "${YELLOW}Step 5: Creating environment file...${NC}"

cat > ${PROD_DIR}/.env << 'ENVFILE'
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=ezloadndump

# App URL (UPDATE THIS to your domain)
NEXT_PUBLIC_BASE_URL=https://ezloadndump.com

# Stripe Payment Integration
# Get your key from: https://dashboard.stripe.com/apikeys
STRIPE_API_KEY=sk_live_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY

# Email SMTP Configuration
# Configure these with your mail server settings
SMTP_HOST=mail.ezloadndump.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@ezloadndump.com
SMTP_PASS=REPLACE_WITH_YOUR_EMAIL_PASSWORD
EMAIL_FROM_NAME=Easy Load & Dump
EMAIL_FROM_ADDRESS=bookings@ezloadndump.com

# CORS
CORS_ORIGINS=https://ezloadndump.com
ENVFILE

echo -e "${GREEN}✓ Environment file created at ${PROD_DIR}/.env${NC}"
echo -e "${RED}⚠ IMPORTANT: Edit ${PROD_DIR}/.env with your actual credentials!${NC}"
echo ""

# ============================================
# STEP 6: Install Dependencies
# ============================================
echo -e "${YELLOW}Step 6: Installing dependencies...${NC}"

cd ${PROD_DIR}

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "Installing yarn..."
    npm install -g yarn
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo "Run: curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo dnf install -y nodejs"
    exit 1
fi

echo "Installing Node.js dependencies..."
yarn install --production=false

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ============================================
# STEP 7: Build Application
# ============================================
echo -e "${YELLOW}Step 7: Building application...${NC}"

cd ${PROD_DIR}
yarn build

echo -e "${GREEN}✓ Application built${NC}"
echo ""

# ============================================
# STEP 8: Create Systemd Service
# ============================================
echo -e "${YELLOW}Step 8: Creating systemd service...${NC}"

cat > ${SERVICE_FILE} << SERVICEFILE
[Unit]
Description=Easy Load & Dump - Dump Trailer Rental Service
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

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable ${PROJECT_NAME}
systemctl start ${PROJECT_NAME}

echo -e "${GREEN}✓ Systemd service created and started${NC}"
echo ""

# ============================================
# STEP 9: Create Apache .htaccess
# ============================================
echo -e "${YELLOW}Step 9: Creating Apache configuration...${NC}"

HTACCESS_CONTENT="RewriteEngine On

# Proxy all requests to Next.js app on port ${PORT}
RewriteRule ^(.*)\$ http://127.0.0.1:${PORT}/\$1 [P,L]

# Required headers for proxying
<IfModule mod_headers.c>
    RequestHeader set X-Forwarded-Proto \"https\"
    RequestHeader set X-Forwarded-Host \"%{HTTP_HOST}s\"
</IfModule>"

echo ""
echo -e "${BLUE}Apache .htaccess configuration:${NC}"
echo "─────────────────────────────────────────────────────"
echo "${HTACCESS_CONTENT}"
echo "─────────────────────────────────────────────────────"
echo ""
echo -e "${YELLOW}Copy the above to your domain's document root .htaccess file${NC}"
echo ""

# Save htaccess to a file for reference
echo "${HTACCESS_CONTENT}" > ${PROD_DIR}/htaccess.txt

# ============================================
# STEP 10: Create Update Script
# ============================================
echo -e "${YELLOW}Step 10: Creating update script...${NC}"

cat > ${GIT_DIR}/update.sh << UPDATESCRIPT
#!/bin/bash
echo "╔═══════════════════════════════════════════╗"
echo "║    Updating Easy Load & Dump...           ║"
echo "╚═══════════════════════════════════════════╝"

cd ${GIT_DIR}
git fetch origin
git pull origin main

echo "Copying files to production..."
cp -r app/* ${PROD_DIR}/
cp package.json ${PROD_DIR}/
cp yarn.lock ${PROD_DIR}/ 2>/dev/null || true

echo "Installing dependencies..."
cd ${PROD_DIR}
yarn install --production=false

echo "Building application..."
yarn build

echo "Restarting service..."
sudo systemctl restart ${PROJECT_NAME}

echo ""
echo "✅ Update complete!"
echo "Check status: sudo systemctl status ${PROJECT_NAME}"
UPDATESCRIPT

chmod +x ${GIT_DIR}/update.sh

echo -e "${GREEN}✓ Update script created at ${GIT_DIR}/update.sh${NC}"
echo ""

# ============================================
# FINAL SUMMARY
# ============================================
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETE! ✓                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Summary:${NC}"
echo "  • Application Port: ${PORT}"
echo "  • Production Directory: ${PROD_DIR}"
echo "  • Service Name: ${PROJECT_NAME}"
echo "  • Update Script: ${GIT_DIR}/update.sh"
echo ""

echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. ${RED}EDIT ENVIRONMENT FILE:${NC}"
echo "   nano ${PROD_DIR}/.env"
echo "   - Add your Stripe API key"
echo "   - Add your SMTP credentials"
echo "   - Update NEXT_PUBLIC_BASE_URL to your domain"
echo ""
echo "2. ${RED}CONFIGURE APACHE:${NC}"
echo "   Copy the .htaccess content from ${PROD_DIR}/htaccess.txt"
echo "   to your domain's document root"
echo ""
echo "3. ${RED}RESTART SERVICE:${NC}"
echo "   sudo systemctl restart ${PROJECT_NAME}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  • Check status:  sudo systemctl status ${PROJECT_NAME}"
echo "  • View logs:     journalctl -u ${PROJECT_NAME} -f"
echo "  • Restart:       sudo systemctl restart ${PROJECT_NAME}"
echo "  • Update:        ${GIT_DIR}/update.sh"
echo ""
echo -e "${GREEN}The app should now be running on port ${PORT}!${NC}"
