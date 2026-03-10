#!/bin/bash
#
# Email SMTP Installer - Reads from email_config.txt and installs to .env
#

CONFIG_FILE="/home/ezloaduni2/public_html/email_config.txt"
ENV_FILE="/opt/ezloadndump/.env"

echo ""
echo "Installing Email SMTP Settings..."
echo ""

# Check file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "File not found: $CONFIG_FILE"
    echo ""
    echo "Create the file with these lines:"
    echo "  SMTP_HOST=mail.ezloadndump.com"
    echo "  SMTP_PORT=465"
    echo "  SMTP_SECURE=true"
    echo "  SMTP_USER=your_email"
    echo "  SMTP_PASS=your_password"
    exit 1
fi

echo "Reading config file..."

# Read values
SMTP_HOST=$(grep "^SMTP_HOST=" "$CONFIG_FILE" | cut -d'=' -f2)
SMTP_PORT=$(grep "^SMTP_PORT=" "$CONFIG_FILE" | cut -d'=' -f2)
SMTP_SECURE=$(grep "^SMTP_SECURE=" "$CONFIG_FILE" | cut -d'=' -f2)
SMTP_USER=$(grep "^SMTP_USER=" "$CONFIG_FILE" | cut -d'=' -f2)
SMTP_PASS=$(grep "^SMTP_PASS=" "$CONFIG_FILE" | cut -d'=' -f2-)

if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
    echo "Missing required fields in config file"
    exit 1
fi

echo "Found SMTP_HOST: $SMTP_HOST"
echo "Found SMTP_PORT: ${SMTP_PORT:-465}"
echo "Found SMTP_USER: $SMTP_USER"
echo "Found SMTP_PASS: ****HIDDEN****"

# Update .env file
sed -i "s|^SMTP_HOST=.*|SMTP_HOST=${SMTP_HOST}|" "$ENV_FILE"
sed -i "s|^SMTP_PORT=.*|SMTP_PORT=${SMTP_PORT:-465}|" "$ENV_FILE"
sed -i "s|^SMTP_SECURE=.*|SMTP_SECURE=${SMTP_SECURE:-true}|" "$ENV_FILE"
sed -i "s|^SMTP_USER=.*|SMTP_USER=${SMTP_USER}|" "$ENV_FILE"
sed -i "s|^SMTP_PASS=.*|SMTP_PASS=${SMTP_PASS}|" "$ENV_FILE"
sed -i "s|^EMAIL_FROM_ADDRESS=.*|EMAIL_FROM_ADDRESS=${SMTP_USER}|" "$ENV_FILE"

echo ""
echo "Updated .env file"

# Verify (hide password)
echo ""
echo "Verification:"
grep -E "^SMTP_|^EMAIL_FROM" "$ENV_FILE" | sed 's/SMTP_PASS=.*/SMTP_PASS=****HIDDEN****/'

# Keep config file for now
echo ""
echo "email_config.txt NOT deleted - delete it manually after testing!"

# Restart service
echo ""
echo "Restarting service..."
systemctl restart ezloadndump
sleep 3
echo "Service restarted"

echo ""
echo "DONE! Email automation is now configured."
echo "Test it from Admin Dashboard > Email Settings"
