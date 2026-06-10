#!/bin/bash
#
# Rebuild and restart the app
#

echo "Rebuilding Easy Load & Dump..."

# Copy updated files to app directory
cp -r /home/ezloadndump/lib /opt/ezloadndump/
cp -r /home/ezloadndump/app /opt/ezloadndump/
cp -r /home/ezloadndump/public /opt/ezloadndump/

# Copy static images to public_html so Apache serves them directly
if [ -d /home/ezloadndump/public/images ]; then
    echo "Copying images to public_html..."
    cp -r /home/ezloadndump/public/images ~/public_html/
fi

# Copy logo to public_html too
if [ -f /home/ezloadndump/public/logo.png ]; then
    cp /home/ezloadndump/public/logo.png ~/public_html/
fi

# Update the PHP proxy
if [ -f /home/ezloadndump/index.php ]; then
    cp /home/ezloadndump/index.php ~/public_html/index.php
    echo "Updated index.php proxy"
fi

# Rebuild
cd /opt/ezloadndump
yarn build

# Restart
systemctl restart ezloadndump
sleep 3

echo ""
if systemctl is-active --quiet ezloadndump; then
    echo "✅ Done! App is running."
    echo "✅ Images copied to public_html/images/"
else
    echo "❌ Service failed. Check: journalctl -u ezloadndump -f"
fi
