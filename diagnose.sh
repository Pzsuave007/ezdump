#!/bin/bash
#
# Easy Load & Dump - Diagnostic Script
# This will show us what's happening on the server
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Easy Load & Dump - Server Diagnostics                     ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "1. SERVICE STATUS"
echo "═══════════════════════════════════════════════════════════════"
systemctl status ezloadndump --no-pager 2>&1 || echo "Service not found"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "2. SERVICE LOGS (last 30 lines)"
echo "═══════════════════════════════════════════════════════════════"
journalctl -u ezloadndump -n 30 --no-pager 2>&1 || echo "No logs found"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3. LOCAL CONNECTION TEST"
echo "═══════════════════════════════════════════════════════════════"
echo "Testing http://127.0.0.1:3002 ..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://127.0.0.1:3002/ 2>&1 || echo "Connection failed"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "4. PORT 3002 CHECK"
echo "═══════════════════════════════════════════════════════════════"
netstat -tlnp 2>/dev/null | grep 3002 || ss -tlnp | grep 3002 || echo "Port 3002 not listening"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "5. .ENV FILE CHECK"
echo "═══════════════════════════════════════════════════════════════"
if [ -f /opt/ezloadndump/.env ]; then
    echo "✅ .env file exists"
    echo "Contents (hiding passwords):"
    cat /opt/ezloadndump/.env | sed 's/PASS=.*/PASS=******/' | sed 's/KEY=.*/KEY=******/'
else
    echo "❌ .env file NOT FOUND!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "6. BUILD CHECK"
echo "═══════════════════════════════════════════════════════════════"
if [ -d /opt/ezloadndump/.next ]; then
    echo "✅ .next build folder exists"
    ls -la /opt/ezloadndump/.next/ | head -10
else
    echo "❌ .next folder NOT FOUND - build may have failed!"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "7. APACHE MOD_PROXY CHECK"
echo "═══════════════════════════════════════════════════════════════"
apache2ctl -M 2>/dev/null | grep proxy || httpd -M 2>/dev/null | grep proxy || echo "Could not check Apache modules"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "8. .HTACCESS FILE"
echo "═══════════════════════════════════════════════════════════════"
echo "Checking /home/ezdumpuni2/public_html/.htaccess ..."
if [ -f /home/ezdumpuni2/public_html/.htaccess ]; then
    echo "Contents:"
    cat /home/ezdumpuni2/public_html/.htaccess
else
    echo "❌ .htaccess NOT FOUND at /home/ezdumpuni2/public_html/"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "DIAGNOSTICS COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Please copy ALL output above and share it."
echo ""
