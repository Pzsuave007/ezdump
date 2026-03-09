# 🚨 AGENT INSTRUCTIONS - READ BEFORE DEPLOYMENT

## Server: cPanel (ezloaduni2)

**CRITICAL: This server does NOT allow Apache proxy in .htaccess!**

## Required Deployment Approach:

1. **Node.js app runs as systemd service** on port 3002+
2. **PHP proxy** (index.php) forwards requests from Apache to Node.js
3. **Simple .htaccess** routes all traffic to index.php

## Key Paths:
- Public HTML: `/home/ezloaduni2/public_html/`
- Git repos: `/home/{project-name}/`
- Production: `/opt/{project-name}/`

## Deploy Script Must Include:

```bash
# 1. Copy files to /opt/{project}
# 2. Create .env file with ALL required variables
# 3. Run: yarn install && yarn build
# 4. Create systemd service on port 3002
# 5. Copy index.php (PHP proxy) to public_html
# 6. Copy .htaccess to public_html
```

## PHP Proxy (index.php):
```php
<?php
$nodeUrl = 'http://127.0.0.1:3002';
$url = $nodeUrl . $_SERVER['REQUEST_URI'];
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);
http_response_code($httpCode);
echo substr($response, $headerSize);
```

## .htaccess (simple, no proxy flags!):
```
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [L,QSA]
```

## DON'T USE:
❌ `RewriteRule ... [P,L]` - Proxy flag NOT allowed
❌ `ProxyPass` - NOT allowed in .htaccess
❌ `ProxyPreserveHost` - NOT allowed

## ALWAYS:
✅ Create deploy.sh that does EVERYTHING in one command
✅ Include PHP proxy setup in deploy script
✅ Create .env file with placeholder values
✅ Test with `curl http://127.0.0.1:3002/` before checking domain

See DEPLOYMENT_GUIDE.md for full details.
