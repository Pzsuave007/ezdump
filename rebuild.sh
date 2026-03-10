#!/bin/bash
#
# Rebuild and restart the app
#

echo "Rebuilding Easy Load & Dump..."

# Copy updated files
cp -r /home/ezloadndump/lib /opt/ezloadndump/
cp -r /home/ezloadndump/app /opt/ezloadndump/

# Rebuild
cd /opt/ezloadndump
yarn build

# Restart
systemctl restart ezloadndump
sleep 3

echo ""
if systemctl is-active --quiet ezloadndump; then
    echo "✅ Done! App is running."
else
    echo "❌ Service failed. Check: journalctl -u ezloadndump -f"
fi
