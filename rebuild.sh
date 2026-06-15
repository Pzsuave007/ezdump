#!/bin/bash
#
# Rebuild and restart the app - Easy Load & Dump
#

echo "========================================="
echo "  Rebuilding Easy Load & Dump..."
echo "========================================="

# Copy updated files to app directory
echo "📁 Copying app files..."
cp -r /home/ezloadndump/lib /opt/ezloadndump/
cp -r /home/ezloadndump/app /opt/ezloadndump/
cp -r /home/ezloadndump/public /opt/ezloadndump/

# Copy static images to public_html so Apache serves them directly
if [ -d /home/ezloadndump/public/images ]; then
    echo "🖼️  Copying images to public_html..."
    cp -r /home/ezloadndump/public/images ~/public_html/
fi

# Copy logo to public_html too
if [ -f /home/ezloadndump/public/logo.png ]; then
    cp /home/ezloadndump/public/logo.png ~/public_html/
fi

# Update the PHP proxy
if [ -f /home/ezloadndump/index.php ]; then
    cp /home/ezloadndump/index.php ~/public_html/index.php
    echo "✅ Updated index.php proxy"
fi

# Install/update systemd service if the file exists in repo
if [ -f /home/ezloadndump/ezloadndump.service ]; then
    cp /home/ezloadndump/ezloadndump.service /etc/systemd/system/ezloadndump.service
    systemctl daemon-reload
    systemctl enable ezloadndump 2>/dev/null
    echo "✅ Systemd service updated"
fi

# Remove any old cron-based startup for ezloadndump
if crontab -l 2>/dev/null | grep -qi "ezload\|yarn.*3002\|nohup.*ezload"; then
    echo "🧹 Removing old cron startup entries..."
    crontab -l 2>/dev/null | grep -vi "ezload\|yarn.*3002\|nohup.*ezload" | crontab -
    echo "✅ Old cron entries removed"
fi

# Kill any stray dev processes (next dev) if they exist
if pgrep -f "next dev.*ezloadndump" > /dev/null 2>&1; then
    echo "🧹 Killing stray dev processes..."
    pkill -f "next dev.*ezloadndump"
fi

# Rebuild
echo "🔨 Building production app..."
cd /opt/ezloadndump
NODE_ENV=production yarn build

# Restart the service
echo "🔄 Restarting service..."
systemctl restart ezloadndump
sleep 3

echo ""
echo "========================================="
if systemctl is-active --quiet ezloadndump; then
    echo "✅ App is running in PRODUCTION mode!"
    echo "✅ Images copied to public_html/images/"
    echo "✅ Systemd service active"
    echo ""
    echo "📊 CPU check:"
    ps -eo pid,%cpu,%mem,cmd | grep -E "next-server|yarn.*start" | grep -v grep
else
    echo "❌ Service failed. Check: journalctl -u ezloadndump -n 50 --no-pager"
fi
echo "========================================="
