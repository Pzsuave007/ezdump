#!/bin/bash
# Fix script v2 - Easy Load & Dump

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

# Create systemd service
cat > /etc/systemd/system/ezloadndump.service << 'EOF'
[Unit]
Description=Easy Load & Dump - Dump Trailer Rental
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ezloadndump
ExecStart=/usr/bin/yarn start -p 3002
Restart=always
RestartSec=10
EnvironmentFile=/opt/ezloadndump/.env
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Install dependencies
cd /opt/ezloadndump
yarn install

# Build
yarn build

# Enable and start service
systemctl daemon-reload
systemctl enable ezloadndump
systemctl start ezloadndump

echo ""
echo "✅ Done!"
echo ""
echo "Check status: systemctl status ezloadndump"
echo "Edit credentials: nano /opt/ezloadndump/.env"
echo ""
echo "Apache .htaccess for your domain:"
echo "RewriteEngine On"
echo "RewriteRule ^(.*)\$ http://127.0.0.1:3002/\$1 [P,L]"
