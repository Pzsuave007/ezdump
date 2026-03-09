#!/bin/bash
#
# Apache Proxy Diagnostic Script
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Apache Proxy Diagnostics                                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "1. CHECKING APACHE PROXY MODULES"
echo "═══════════════════════════════════════════════════════════════"
httpd -M 2>/dev/null | grep -i proxy || apache2ctl -M 2>/dev/null | grep -i proxy || echo "Could not detect proxy modules"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "2. APACHE ERROR LOG (last 30 lines)"
echo "═══════════════════════════════════════════════════════════════"
tail -30 /var/log/apache2/error.log 2>/dev/null || \
tail -30 /var/log/httpd/error_log 2>/dev/null || \
tail -30 /usr/local/apache/logs/error_log 2>/dev/null || \
tail -30 /var/log/httpd/error.log 2>/dev/null || \
echo "Could not find Apache error log"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3. CHECKING .HTACCESS FILES"
echo "═══════════════════════════════════════════════════════════════"
echo "Main public_html/.htaccess:"
cat /home/ezdumpuni2/public_html/.htaccess 2>/dev/null || echo "Not found"

echo ""
echo "Any other .htaccess in public_html:"
find /home/ezdumpuni2/public_html -name ".htaccess" -type f 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "4. TESTING LOCAL APP"
echo "═══════════════════════════════════════════════════════════════"
curl -s -o /dev/null -w "Local app status: %{http_code}\n" http://127.0.0.1:3002/

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "5. CHECKING IF PROXY IS BLOCKED"
echo "═══════════════════════════════════════════════════════════════"
# Check Apache config for proxy settings
grep -r "ProxyPass\|ProxyRequests\|mod_proxy" /etc/httpd/conf* 2>/dev/null | head -10 || \
grep -r "ProxyPass\|ProxyRequests\|mod_proxy" /etc/apache2/* 2>/dev/null | head -10 || \
grep -r "ProxyPass\|ProxyRequests\|mod_proxy" /usr/local/apache/conf/* 2>/dev/null | head -10 || \
echo "No proxy config found"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "DIAGNOSTICS COMPLETE - Copy all output above"
echo "═══════════════════════════════════════════════════════════════"
echo ""
