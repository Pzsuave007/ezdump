#!/bin/bash
# Fix script for Easy Load & Dump setup

echo "Fixing Easy Load & Dump installation..."

# Clear destination
rm -rf /opt/ezloadndump/*

# Copy all project files
cp -r /home/ezloadndump/app /opt/ezloadndump/
cp -r /home/ezloadndump/components /opt/ezloadndump/
cp -r /home/ezloadndump/lib /opt/ezloadndump/
cp -r /home/ezloadndump/public /opt/ezloadndump/
cp /home/ezloadndump/package.json /opt/ezloadndump/
cp /home/ezloadndump/next.config.js /opt/ezloadndump/
cp /home/ezloadndump/tailwind.config.js /opt/ezloadndump/
cp /home/ezloadndump/postcss.config.js /opt/ezloadndump/
cp /home/ezloadndump/jsconfig.json /opt/ezloadndump/
cp /home/ezloadndump/components.json /opt/ezloadndump/

# Create .env file
cat > /opt/ezloadndump/.env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=ezloadndump
NEXT_PUBLIC_BASE_URL=https://ezloadndump.com
STRIPE_API_KEY=sk_live_REPLACE_WITH_YOUR_KEY
SMTP_HOST=mail.ezloadndump.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@ezloadndump.com
SMTP_PASS=REPLACE_WITH_PASSWORD
EMAIL_FROM_NAME=Easy Load & Dump
EMAIL_FROM_ADDRESS=bookings@ezloadndump.com
CORS_ORIGINS=https://ezloadndump.com
EOF

# Install dependencies
cd /opt/ezloadndump
yarn install

# Build
yarn build

# Restart service
sudo systemctl restart ezloadndump

echo ""
echo "✅ Done! Now edit your credentials:"
echo "   nano /opt/ezloadndump/.env"
