#!/bin/bash
#
# Easy Load & Dump - Setup PHP Proxy
# This sets up the PHP proxy in your public_html folder
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Setting up PHP Proxy for Easy Load & Dump                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# The correct path (based on Apache logs)
PUBLIC_HTML="/home/ezloaduni2/public_html"

# Check if directory exists
if [ ! -d "$PUBLIC_HTML" ]; then
    echo "❌ Directory $PUBLIC_HTML not found!"
    echo "Please check your correct public_html path"
    exit 1
fi

echo "→ Installing PHP proxy to $PUBLIC_HTML ..."

# Copy index.php
cp index.php "$PUBLIC_HTML/index.php"
echo "✅ Copied index.php"

# Create .htaccess
cat > "$PUBLIC_HTML/.htaccess" << 'HTACCESS'
# Easy Load & Dump - .htaccess
# Routes all requests through the PHP proxy

RewriteEngine On

# Don't rewrite requests for existing files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Route everything through index.php
RewriteRule ^(.*)$ index.php [L,QSA]
HTACCESS
echo "✅ Created .htaccess"

# Test the local app
echo ""
echo "→ Testing local app..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3002/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Node.js app is running (HTTP $HTTP_CODE)"
else
    echo "⚠️  Node.js app returned HTTP $HTTP_CODE"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                    SETUP COMPLETE!                             "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Files installed to: $PUBLIC_HTML"
echo "  - index.php (PHP proxy)"
echo "  - .htaccess (routing rules)"
echo ""
echo "Test your site now: https://ezloadndump.com"
echo ""
