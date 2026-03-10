# 🚀 CPANEL SERVER DEPLOYMENT TEMPLATE
## Generic Instructions for ANY Next.js Project

---

## ⚠️ READ THIS FIRST - CRITICAL SERVER LIMITATIONS

This is a **cPanel shared hosting server** with these restrictions:

1. **Apache proxy directives are BLOCKED in .htaccess** - The `[P]` flag, `ProxyPass`, and `ProxyPreserveHost` will NOT work
2. **Must use PHP proxy approach** - A PHP file forwards requests to Node.js
3. **Node.js runs as systemd service** - Not directly in public_html

---

## 📋 BEFORE YOU START - GATHER THIS INFO

Ask the user for:

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Short name, no spaces, lowercase | `mybusiness` |
| `DOMAIN` | The website domain | `mybusiness.com` |
| `PORT` | Unique port (3002-3999, check availability) | `3003` |

**To check if a port is available:**
```bash
netstat -tlnp | grep {PORT}
```
If nothing shows, the port is free.

---

## 📁 FOLDER STRUCTURE TO CREATE

```
/home/{PROJECT_NAME}/          ← Clone git repo here
    └── (all project files)
    └── deploy.sh              ← Deployment script (create this!)

/opt/{PROJECT_NAME}/           ← Production files go here
    ├── .env                   ← Environment variables
    ├── .next/                 ← Build output
    └── (copied project files)

/home/ezloaduni2/public_html/  ← Domain document root (Apache)
    ├── index.php              ← PHP proxy
    └── .htaccess              ← Routing rules
```

---

## 🔧 COMPLETE DEPLOYMENT SCRIPT TEMPLATE

Create this file as `deploy.sh` in the project root:

```bash
#!/bin/bash
#
# Deployment Script for cPanel + Next.js
# Run with: chmod +x deploy.sh && sudo ./deploy.sh
#

# ╔═══════════════════════════════════════════════════════════════╗
# ║  CONFIGURATION - UPDATE THESE FOR YOUR PROJECT                ║
# ╚═══════════════════════════════════════════════════════════════╝

PROJECT_NAME="REPLACE_WITH_PROJECT_NAME"
DOMAIN="REPLACE_WITH_DOMAIN"
PORT=REPLACE_WITH_PORT
PUBLIC_HTML="/home/ezloaduni2/public_html"

# Calculated paths (don't change)
REPO_DIR="/home/${PROJECT_NAME}"
PROD_DIR="/opt/${PROJECT_NAME}"

# ╔═══════════════════════════════════════════════════════════════╗
# ║  DEPLOYMENT SCRIPT - DON'T MODIFY BELOW                       ║
# ╚═══════════════════════════════════════════════════════════════╝

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Deploying: ${PROJECT_NAME}"
echo "║  Domain:    ${DOMAIN}"
echo "║  Port:      ${PORT}"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if port is already in use by another service
PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep ":${PORT} " | grep -v ${PROJECT_NAME})
if [ ! -z "$PORT_CHECK" ]; then
    echo "❌ ERROR: Port ${PORT} is already in use!"
    echo "$PORT_CHECK"
    echo "Please choose a different port."
    exit 1
fi

# Stop existing service if running
echo "→ Stopping existing service..."
systemctl stop ${PROJECT_NAME} 2>/dev/null || true

# Clean and create production directory
echo "→ Setting up production directory..."
rm -rf ${PROD_DIR}
mkdir -p ${PROD_DIR}

# Copy project files
echo "→ Copying files..."
cd ${REPO_DIR}

# Copy common Next.js project directories
for dir in app components lib public hooks src pages styles utils; do
    if [ -d "$dir" ]; then
        cp -r "$dir" ${PROD_DIR}/
    fi
done

# Copy config files
for file in package.json yarn.lock package-lock.json next.config.js next.config.mjs tailwind.config.js tailwind.config.ts postcss.config.js postcss.config.mjs jsconfig.json tsconfig.json components.json; do
    if [ -f "$file" ]; then
        cp "$file" ${PROD_DIR}/
    fi
done

# Create .env file
echo "→ Creating .env file..."
cat > ${PROD_DIR}/.env << ENVFILE
# ============================================
# DATABASE
# ============================================
MONGO_URL=mongodb://localhost:27017
DB_NAME=${PROJECT_NAME}

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}
NODE_ENV=production

# ============================================
# API KEYS - Add your keys below
# ============================================
# STRIPE_API_KEY=sk_live_your_key_here
# OPENAI_API_KEY=sk-your_key_here

# ============================================
# EMAIL SMTP (if needed)
# ============================================
# SMTP_HOST=mail.${DOMAIN}
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=noreply@${DOMAIN}
# SMTP_PASS=your_password
# EMAIL_FROM_NAME=Your Business Name
# EMAIL_FROM_ADDRESS=noreply@${DOMAIN}

# ============================================
# CORS
# ============================================
CORS_ORIGINS=https://${DOMAIN}
ENVFILE

# Install dependencies
echo "→ Installing dependencies..."
cd ${PROD_DIR}
yarn install --production=false 2>/dev/null || npm install

# Build the application
echo "→ Building application (this may take a few minutes)..."
rm -rf .next
yarn build 2>/dev/null || npm run build

# Check if build succeeded
if [ ! -d ".next" ]; then
    echo ""
    echo "❌ BUILD FAILED! Check the errors above."
    exit 1
fi
echo "✅ Build successful!"

# Create systemd service
echo "→ Creating systemd service..."
cat > /etc/systemd/system/${PROJECT_NAME}.service << SERVICEFILE
[Unit]
Description=${PROJECT_NAME} - Next.js Application
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=${PROD_DIR}
ExecStart=/usr/bin/yarn start -p ${PORT}
Restart=always
RestartSec=10
EnvironmentFile=${PROD_DIR}/.env
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICEFILE

# Reload systemd and start service
echo "→ Starting service..."
systemctl daemon-reload
systemctl enable ${PROJECT_NAME}
systemctl start ${PROJECT_NAME}

# Wait for the service to start
echo "→ Waiting for application to start..."
sleep 5

# Check if service is running
if ! systemctl is-active --quiet ${PROJECT_NAME}; then
    echo ""
    echo "❌ Service failed to start! Check logs:"
    journalctl -u ${PROJECT_NAME} -n 30 --no-pager
    exit 1
fi

# Create PHP proxy
echo "→ Setting up PHP proxy in public_html..."
cat > ${PUBLIC_HTML}/index.php << 'PHPPROXY'
<?php
/**
 * PHP Proxy - Forwards requests to Node.js application
 * DO NOT MODIFY unless you know what you're doing
 */

$nodePort = 'PORTPLACEHOLDER';
$nodeUrl = "http://127.0.0.1:{$nodePort}";

$requestUri = $_SERVER['REQUEST_URI'];
$url = $nodeUrl . $requestUri;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    $lower = strtolower($name);
    if ($lower !== 'host' && $lower !== 'connection' && $lower !== 'content-length') {
        $headers[] = "$name: $value";
    }
}
if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

// Forward request body for POST/PUT/PATCH
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $body = file_get_contents('php://input');
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo '<h1>502 Bad Gateway</h1>';
    echo '<p>The application server is not responding.</p>';
    echo '<!-- Error: ' . curl_error($ch) . ' -->';
    curl_close($ch);
    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$headerText = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);

// Forward response headers
$headerLines = explode("\r\n", $headerText);
foreach ($headerLines as $header) {
    if (empty($header)) continue;
    if (stripos($header, 'HTTP/') === 0) continue;
    if (stripos($header, 'Transfer-Encoding:') === 0) continue;
    if (stripos($header, 'Connection:') === 0) continue;
    if (stripos($header, 'Keep-Alive:') === 0) continue;
    header($header);
}

echo $body;
PHPPROXY

# Replace port placeholder in PHP file
sed -i "s/PORTPLACEHOLDER/${PORT}/g" ${PUBLIC_HTML}/index.php

# Create .htaccess
cat > ${PUBLIC_HTML}/.htaccess << 'HTACCESSFILE'
# Route all requests through PHP proxy
# DO NOT add [P] proxy flags - they are not allowed on this server!

RewriteEngine On

# Don't rewrite actual files or directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Send everything else to index.php
RewriteRule ^(.*)$ index.php [L,QSA]
HTACCESSFILE

# Test the application
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TESTING DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════"

# Test local connection
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PORT}/ 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Local test: HTTP 200 OK"
else
    echo "⚠️  Local test: HTTP ${HTTP_CODE}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  🌐 Website: https://${DOMAIN}"
echo ""
echo "  📁 Files:"
echo "     Production:  ${PROD_DIR}"
echo "     Environment: ${PROD_DIR}/.env"
echo ""
echo "  🔧 Commands:"
echo "     Status:   sudo systemctl status ${PROJECT_NAME}"
echo "     Logs:     journalctl -u ${PROJECT_NAME} -f"
echo "     Restart:  sudo systemctl restart ${PROJECT_NAME}"
echo ""
echo "  ⚠️  NEXT STEPS:"
echo "     1. Edit ${PROD_DIR}/.env to add your API keys"
echo "     2. Run: sudo systemctl restart ${PROJECT_NAME}"
echo ""
```

---

## 📝 STEP-BY-STEP FOR NEW PROJECTS

### Step 1: Clone the repository
```bash
cd /home
git clone {GITHUB_REPO_URL} {PROJECT_NAME}
```

### Step 2: Create deploy.sh
Copy the template above into the project and update these 3 lines:
```bash
PROJECT_NAME="your_project_name"
DOMAIN="your_domain.com"
PORT=3003  # Use any free port: 3002, 3003, 3004, etc.
```

### Step 3: Run deployment
```bash
cd /home/{PROJECT_NAME}
chmod +x deploy.sh
sudo ./deploy.sh
```

### Step 4: Configure API keys
```bash
nano /opt/{PROJECT_NAME}/.env
# Add your API keys, then:
sudo systemctl restart {PROJECT_NAME}
```

---

## 🔄 HOW TO UPDATE AN EXISTING PROJECT

```bash
cd /home/{PROJECT_NAME}
git pull
sudo ./deploy.sh
```

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Port already in use | Choose different port, update deploy.sh |
| Build fails | Check console errors, usually missing dependencies |
| 502 Bad Gateway | Service crashed - check: `journalctl -u {PROJECT_NAME} -f` |
| 404 errors | Build didn't complete - rebuild: `cd /opt/{PROJECT_NAME} && yarn build` |
| Changes not showing | Clear cache + restart: `sudo systemctl restart {PROJECT_NAME}` |

---

## ❌ THINGS THAT DON'T WORK ON THIS SERVER

Never use these in .htaccess:
- `RewriteRule ... [P,L]` ← Proxy flag blocked
- `ProxyPass` ← Not allowed
- `ProxyPreserveHost` ← Not allowed
- `ProxyRequests` ← Not allowed

---

## 📌 SERVER REFERENCE

- **cPanel User:** ezloaduni2
- **Public HTML:** /home/ezloaduni2/public_html/
- **MongoDB:** localhost:27017
- **Package Manager:** yarn (preferred) or npm
- **Service Manager:** systemd
