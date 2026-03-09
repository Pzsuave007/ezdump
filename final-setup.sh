#!/bin/bash
# Final setup script - creates .env and rebuilds

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

echo "Created .env file"

# Rebuild
cd /opt/ezloadndump
yarn build

# Restart service
systemctl restart ezloadndump

echo ""
echo "Done! Check your site now."
