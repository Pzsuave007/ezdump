#!/bin/bash
#
# Simple Key Installer - Reads from api_keys.txt and installs to .env
#

KEYS_FILE="/home/ezloaduni2/public_html/api_keys.txt"
ENV_FILE="/opt/ezloadndump/.env"

echo ""
echo "Installing Stripe Keys..."
echo ""

# Check file exists
if [ ! -f "$KEYS_FILE" ]; then
    echo "File not found: $KEYS_FILE"
    exit 1
fi

# Read the secret key
SECRET_KEY=$(grep "STRIPE_SECRET_KEY" "$KEYS_FILE" | cut -d'=' -f2)
# Read the publishable key
PUBLISH_KEY=$(grep "STRIPE_PUBLISHABLE_KEY" "$KEYS_FILE" | cut -d'=' -f2)

echo "File contents:"
cat "$KEYS_FILE" | sed 's/=.*/=****HIDDEN****/'
echo ""

if [ -z "$SECRET_KEY" ]; then
    echo "No STRIPE_SECRET_KEY found"
    exit 1
fi

echo "Found Secret Key"

if [ -n "$PUBLISH_KEY" ]; then
    echo "Found Publishable Key"
fi

# Update .env - Secret Key
sed -i "s|^STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=${SECRET_KEY}|" "$ENV_FILE"
echo "Updated STRIPE_SECRET_KEY in .env"

# Update .env - Publishable Key (if provided)
if [ -n "$PUBLISH_KEY" ]; then
    sed -i "s|^STRIPE_PUBLISHABLE_KEY=.*|STRIPE_PUBLISHABLE_KEY=${PUBLISH_KEY}|" "$ENV_FILE"
    echo "Updated STRIPE_PUBLISHABLE_KEY in .env"
fi

# Verify
echo ""
echo "Verification - Stripe keys in .env:"
grep "STRIPE" "$ENV_FILE" | sed 's/=.*/=****HIDDEN****/'

# Keep the keys file for now (user will delete manually after testing)
echo ""
echo "api_keys.txt NOT deleted - delete it manually after testing!"

# Restart
echo ""
echo "Restarting service..."
systemctl restart ezloadndump
sleep 3
echo "Service restarted"

echo ""
echo "DONE! Test: https://ezloadndump.com"
