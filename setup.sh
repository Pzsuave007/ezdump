#!/bin/bash
#
# Easy Load & Dump - Server Setup Script
# Port: 3002 (verified available)
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=3002
PROJECT_NAME="ezloadndump"
GIT_DIR="/home/${PROJECT_NAME}"
PROD_DIR="/opt/${PROJECT_NAME}"
SERVICE_FILE="/etc/systemd/system/${PROJECT_NAME}.service"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          Easy Load & Dump - Server Setup                      ║"
echo "║                    Port: ${PORT}                                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p ${PROD_DIR}
mkdir -p ${PROD_DIR}/public

# Copy files from current directory
echo -e "${YELLOW}Copying application files...${NC}"
cp -r app/* ${PROD_DIR}/ 2>/dev/null || cp -r ./* ${PROD_DIR}/ 2>/dev/null || true
cp -r public/* ${PROD_DIR}/public/ 2>/dev/null || true

# Create .env file
echo -e "${YELLOW}Creating environment file...${NC}"
cat > ${PROD_DIR}/.env << 'ENVFILE'
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=ezloadndump

# App URL - UPDATE THIS TO YOUR DOMAIN
NEXT_PUBLIC_BASE_URL=https://ezloadndump.com

# Stripe - Get from https://dashboard.stripe.com/apikeys
STRIPE_API_KEY=sk_live_REPLACE_WITH_YOUR_KEY

# Email SMTP
SMTP_HOST=mail.ezloadndump.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@ezloadndump.com
SMTP_PASS=REPLACE_WITH_PASSWORD
EMAIL_FROM_NAME=Easy Load & Dump
EMAIL_FROM_ADDRESS=bookings@ezloadndump.com

CORS_ORIGINS=https://ezloadndump.com
ENVFILE

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd ${PROD_DIR}
yarn install --production=false

# Build
echo -e "${YELLOW}Building application...${NC}"
yarn build

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > ${SERVICE_FILE} << SERVICEFILE
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

systemctl daemon-reload
systemctl enable ${PROJECT_NAME}
systemctl start ${PROJECT_NAME}

# Create update script
cat > ${GIT_DIR}/update.sh << 'UPDATESCRIPT'
#!/bin/bash
cd /home/ezloadndump
git pull origin main
cp -r app/* /opt/ezloadndump/
cd /opt/ezloadndump
yarn install --production=false
yarn build
sudo systemctl restart ezloadndump
echo "✅ Update complete!"
UPDATESCRIPT
chmod +x ${GIT_DIR}/update.sh

# Show Apache config
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    SETUP COMPLETE!                             ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Apache .htaccess (copy to your domain's document root):${NC}"
echo "─────────────────────────────────────────────────────"
echo "RewriteEngine On"
echo "RewriteRule ^(.*)\$ http://127.0.0.1:${PORT}/\$1 [P,L]"
echo "─────────────────────────────────────────────────────"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Edit credentials: nano ${PROD_DIR}/.env"
echo "2. Add .htaccess to your domain root"
echo "3. Restart: sudo systemctl restart ${PROJECT_NAME}"
echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  Status:  sudo systemctl status ${PROJECT_NAME}"
echo "  Logs:    journalctl -u ${PROJECT_NAME} -f"
echo "  Update:  ${GIT_DIR}/update.sh"
