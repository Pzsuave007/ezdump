# Easy Load & Dump - Server Deployment Guide
## For GoDaddy VPS (AlmaLinux 9 + cPanel + Apache)

---

## Quick Start (One Command)
```bash
# First, find available ports:
netstat -tuln | grep LISTEN | awk '{print $4}' | grep -oE '[0-9]+$' | sort -n | uniq

# Then run the setup (replace PORT with an available port, e.g., 3001):
curl -sSL https://raw.githubusercontent.com/YOUR_REPO/main/setup.sh | bash -s -- PORT
```

---

## Architecture Overview
```
Internet → Apache (port 80/443) → .htaccess proxy rules → Next.js App (port XXXX)
```

## Directory Structure
```
/home/ezloadndump/              # Git repository (source code)
/opt/ezloadndump/               # Production deployment
  ├── app/                      # Next.js application
  │   ├── .next/                # Built Next.js files
  │   ├── public/               # Static files (logo, etc.)
  │   └── node_modules/
  └── .env                      # Environment variables (PRIVATE - not in git)
```

---

## Environment Variables Template (/opt/ezloadndump/.env)
```bash
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=ezloadndump

# App URL (your domain)
NEXT_PUBLIC_BASE_URL=https://ezloadndump.com

# Stripe Payment Integration (Get from https://dashboard.stripe.com/apikeys)
STRIPE_API_KEY=sk_live_your_stripe_secret_key_here

# Email SMTP Configuration (Your mail server)
SMTP_HOST=mail.ezloadndump.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bookings@ezloadndump.com
SMTP_PASS=your_email_password_here
EMAIL_FROM_NAME=Easy Load & Dump
EMAIL_FROM_ADDRESS=bookings@ezloadndump.com

# CORS (your domain)
CORS_ORIGINS=https://ezloadndump.com
```

---

## Systemd Service (/etc/systemd/system/ezloadndump.service)
```ini
[Unit]
Description=Easy Load & Dump - Next.js Application
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ezloadndump
ExecStart=/usr/bin/yarn start -p PORT_NUMBER
Restart=always
RestartSec=10
EnvironmentFile=/opt/ezloadndump/.env
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Apache .htaccess Configuration
Place this at your domain's document root (e.g., `/home/username/public_html/ezloadndump/.htaccess`):
```apache
RewriteEngine On

# Proxy all requests to Next.js app
RewriteRule ^(.*)$ http://127.0.0.1:PORT_NUMBER/$1 [P,L]

# Required headers for proxying
<IfModule mod_headers.c>
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "%{HTTP_HOST}s"
</IfModule>
```

---

## Key Commands
```bash
# Start/restart service
sudo systemctl restart ezloadndump
sudo systemctl enable ezloadndump

# Check status
sudo systemctl status ezloadndump

# View logs
journalctl -u ezloadndump -f

# Rebuild after code changes
cd /opt/ezloadndump && yarn build && sudo systemctl restart ezloadndump
```

---

## Update Script (/home/ezloadndump/update.sh)
```bash
#!/bin/bash
echo "Updating Easy Load & Dump..."
cd /home/ezloadndump
git fetch origin
git pull origin main
cp -r app/* /opt/ezloadndump/
cp package.json /opt/ezloadndump/
cp yarn.lock /opt/ezloadndump/
cd /opt/ezloadndump
yarn install --production
yarn build
sudo systemctl restart ezloadndump
echo "✅ Update complete!"
```

---

## Ports Used by Other Projects (Reference)
- GradeProphet: Backend 8001, Frontend 3000
- Check what's in use: `netstat -tuln | grep LISTEN`

## Recommended Ports for This Project
- **3001** or **3002** (if 3000 is taken)
- Any port between 3000-9000 that's not in use

---

## Stripe Setup
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (starts with `sk_live_` for production or `sk_test_` for testing)
3. Add to `/opt/ezloadndump/.env` as `STRIPE_API_KEY`

## Email/SMTP Setup
Configure your mail server and add these to `.env`:
- SMTP_HOST: Your mail server hostname
- SMTP_PORT: Usually 587 (TLS) or 465 (SSL)
- SMTP_USER: Email account username
- SMTP_PASS: Email account password
