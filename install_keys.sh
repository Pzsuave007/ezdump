#!/bin/bash
#
# Easy Load & Dump - API Key Installer
# 
# HOW TO USE:
# 1. Create a file: /home/ezloaduni2/public_html/api_keys.txt
# 2. Add your keys in this format (one per line):
#      STRIPE_SECRET_KEY=sk_live_your_secret_key_here
#      STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
#      SMTP_PASS=your_email_password
# 3. Run this script: sudo ./install_keys.sh
# 4. The script will add the keys to .env and DELETE the api_keys.txt file for security
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     API Key Installer                                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Paths
KEYS_FILE="/home/ezloaduni2/public_html/api_keys.txt"
ENV_FILE="/opt/ezloadndump/.env"
SERVICE_NAME="ezloadndump"

# Check if keys file exists
if [ ! -f "$KEYS_FILE" ]; then
    echo "❌ ERROR: Keys file not found!"
    echo ""
    echo "Please create: $KEYS_FILE"
    echo ""
    echo "Add your keys like this (one per line):"
    echo "   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx"
    echo "   STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx"
    echo "   SMTP_PASS=your_password"
    echo ""
    exit 1
fi

echo "✅ Found keys file: $KEYS_FILE"
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: .env file not found at $ENV_FILE"
    exit 1
fi

echo "→ Reading keys..."

# Read each line from the keys file
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [ -z "$line" ] || [[ "$line" == \#* ]]; then
        continue
    fi
    
    # Extract key name and value
    KEY_NAME=$(echo "$line" | cut -d'=' -f1)
    KEY_VALUE=$(echo "$line" | cut -d'=' -f2-)
    
    if [ -z "$KEY_NAME" ] || [ -z "$KEY_VALUE" ]; then
        continue
    fi
    
    echo "   Processing: $KEY_NAME"
    
    # Check if key already exists in .env
    if grep -q "^${KEY_NAME}=" "$ENV_FILE"; then
        # Update existing key
        sed -i "s|^${KEY_NAME}=.*|${KEY_NAME}=${KEY_VALUE}|" "$ENV_FILE"
        echo "   ✅ Updated: $KEY_NAME"
    else
        # Add new key
        echo "${KEY_NAME}=${KEY_VALUE}" >> "$ENV_FILE"
        echo "   ✅ Added: $KEY_NAME"
    fi
    
done < "$KEYS_FILE"

echo ""
echo "→ Removing keys file for security..."
rm -f "$KEYS_FILE"
echo "   ✅ Deleted: $KEYS_FILE"

echo ""
echo "→ Restarting service..."
systemctl restart $SERVICE_NAME

# Check if service restarted successfully
sleep 3
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "   ✅ Service restarted successfully!"
else
    echo "   ⚠️  Service may have issues. Check: journalctl -u $SERVICE_NAME -f"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ API KEYS INSTALLED SUCCESSFULLY!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Your keys have been added to: $ENV_FILE"
echo "The api_keys.txt file has been deleted for security."
echo ""
echo "Test your site: https://ezloadndump.com"
echo ""
