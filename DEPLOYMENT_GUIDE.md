# 🚀 CPANEL + NEXT.JS DEPLOYMENT GUIDE
## For Future Projects on ezloaduni2 Server

---

## ⚠️ CRITICAL INFO FOR AI AGENTS

**READ THIS FIRST BEFORE BUILDING ANYTHING!**

This server is a **cPanel shared hosting** environment with specific limitations:

1. **Apache proxy directives (like `[P]` flag) are NOT allowed in .htaccess**
2. **Must use PHP proxy approach** to forward requests to Node.js apps
3. **The correct public_html path is:** `/home/ezloaduni2/public_html/`
4. **Node.js apps run via systemd services** on custom ports (3002, 3003, etc.)

---

## 📁 SERVER STRUCTURE

```
/home/ezloaduni2/          ← cPanel user home
├── public_html/           ← Domain document root (Apache serves from here)
│   ├── index.php          ← PHP PROXY (forwards to Node.js)
│   └── .htaccess          ← Routes all requests to index.php
│
/home/{project-name}/      ← Git repository clone location
│   └── (project files)
│
/opt/{project-name}/       ← Production deployment location
│   ├── .env               ← Environment variables
│   ├── .next/             ← Next.js build output
│   └── (all project files)
```

---

## 🔧 COMPLETE DEPLOYMENT PROCESS

### Step 1: Clone Repository
```bash
cd /home
git clone {REPO_URL} {project-name}
cd {project-name}
```

### Step 2: Run the All-in-One Setup Script
The project MUST include a `deploy.sh` script (template below).

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

---

## 📄 REQUIRED FILES FOR EVERY PROJECT

### File 1: `deploy.sh` (All-in-One Deployment Script)

```bash
#!/bin/bash
#
# Next.js cPanel Deployment Script
# Handles: Build, Service Creation, PHP Proxy Setup
#

# ============================================
# CONFIGURATION - CHANGE THESE FOR EACH PROJECT
# ============================================
PROJECT_NAME="myproject"
DOMAIN="mydomain.com"
PORT=3002
PUBLIC_HTML="/home/ezloaduni2/public_html"
REPO_DIR="/home/${PROJECT_NAME}"
PROD_DIR="/opt/${PROJECT_NAME}"

# ============================================
# SCRIPT START
# ============================================
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Deploying ${PROJECT_NAME} to ${DOMAIN}                    "
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Stop existing service
echo "→ Stopping existing service..."
systemctl stop ${PROJECT_NAME} 2>/dev/null || true

# Clean and create production directory
echo "→ Setting up production directory..."
rm -rf ${PROD_DIR}
mkdir -p ${PROD_DIR}

# Copy project files
echo "→ Copying files..."
cd ${REPO_DIR}
cp -r app ${PROD_DIR}/ 2>/dev/null || true
cp -r components ${PROD_DIR}/ 2>/dev/null || true
cp -r lib ${PROD_DIR}/ 2>/dev/null || true
cp -r public ${PROD_DIR}/ 2>/dev/null || true
cp -r hooks ${PROD_DIR}/ 2>/dev/null || true
cp -r src ${PROD_DIR}/ 2>/dev/null || true
cp package.json ${PROD_DIR}/
cp yarn.lock ${PROD_DIR}/ 2>/dev/null || true
cp next.config.js ${PROD_DIR}/ 2>/dev/null || true
cp next.config.mjs ${PROD_DIR}/ 2>/dev/null || true
cp tailwind.config.js ${PROD_DIR}/ 2>/dev/null || true
cp postcss.config.js ${PROD_DIR}/ 2>/dev/null || true
cp jsconfig.json ${PROD_DIR}/ 2>/dev/null || true
cp tsconfig.json ${PROD_DIR}/ 2>/dev/null || true
cp components.json ${PROD_DIR}/ 2>/dev/null || true

# Create .env file
echo "→ Creating .env file..."
cat > ${PROD_DIR}/.env << ENVFILE
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=${PROJECT_NAME}

# Application URL
NEXT_PUBLIC_BASE_URL=https://${DOMAIN}

# Add your API keys below
# STRIPE_API_KEY=sk_live_xxxxx
# OPENAI_API_KEY=sk-xxxxx

# Email SMTP (if needed)
# SMTP_HOST=mail.${DOMAIN}
# SMTP_PORT=587
# SMTP_USER=noreply@${DOMAIN}
# SMTP_PASS=your_password

CORS_ORIGINS=https://${DOMAIN}
ENVFILE

# Install dependencies
echo "→ Installing dependencies..."
cd ${PROD_DIR}
yarn install --production=false

# Build
echo "→ Building application..."
rm -rf .next
yarn build

if [ ! -d ".next" ]; then
    echo "❌ BUILD FAILED!"
    exit 1
fi

# Create systemd service
echo "→ Creating systemd service..."
cat > /etc/systemd/system/${PROJECT_NAME}.service << SERVICEFILE
[Unit]
Description=${PROJECT_NAME}
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

# Start service
echo "→ Starting service..."
systemctl daemon-reload
systemctl enable ${PROJECT_NAME}
systemctl start ${PROJECT_NAME}

# Wait for startup
sleep 5

# Create PHP proxy
echo "→ Setting up PHP proxy..."
cat > ${PUBLIC_HTML}/index.php << 'PHPFILE'
<?php
$nodeUrl = 'http://127.0.0.1:PORTPLACEHOLDER';
$requestUri = $_SERVER['REQUEST_URI'];
$url = $nodeUrl . $requestUri;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host' && strtolower($name) !== 'connection') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
if (curl_errno($ch)) {
    http_response_code(502);
    echo 'Proxy Error: ' . curl_error($ch);
    curl_close($ch);
    exit;
}
curl_close($ch);
$headerText = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);
http_response_code($httpCode);
$headerLines = explode("\r\n", $headerText);
foreach ($headerLines as $header) {
    if (empty($header)) continue;
    if (stripos($header, 'HTTP/') === 0) continue;
    if (stripos($header, 'Transfer-Encoding:') === 0) continue;
    if (stripos($header, 'Connection:') === 0) continue;
    header($header);
}
echo $body;
PHPFILE

# Replace port placeholder
sed -i "s/PORTPLACEHOLDER/${PORT}/g" ${PUBLIC_HTML}/index.php

# Create .htaccess
cat > ${PUBLIC_HTML}/.htaccess << 'HTACCESSFILE'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [L,QSA]
HTACCESSFILE

# Test
echo ""
echo "═══════════════════════════════════════════════════════════════"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PORT}/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! App is running!"
    echo ""
    echo "🌐 Your site is live at: https://${DOMAIN}"
else
    echo "⚠️  App returned HTTP ${HTTP_CODE}"
    echo "Check logs: journalctl -u ${PROJECT_NAME} -f"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Useful commands:"
echo "  Status:  sudo systemctl status ${PROJECT_NAME}"
echo "  Logs:    journalctl -u ${PROJECT_NAME} -f"
echo "  Restart: sudo systemctl restart ${PROJECT_NAME}"
echo "  Edit env: nano ${PROD_DIR}/.env"
echo ""
```

---

## 🎯 QUICK REFERENCE FOR AI AGENTS

### DO ✅
- Use the `deploy.sh` script template above
- Use PHP proxy (index.php) to forward requests
- Run Node.js apps as systemd services
- Use ports 3002, 3003, 3004, etc. for different projects
- Create .env file with all required variables
- Test locally with `curl http://127.0.0.1:{PORT}/` before checking domain

### DON'T ❌
- Don't use `[P]` proxy flag in .htaccess (NOT ALLOWED on this server)
- Don't use `ProxyPass` or `ProxyPreserveHost` in .htaccess
- Don't try to run Node.js directly in public_html
- Don't forget to create the .env file
- Don't use port 3000 (might conflict with other services)

---

## 🔄 UPDATE PROCESS

After making code changes:

```bash
cd /home/{project-name}
git pull
sudo ./deploy.sh
```

Or create an `update.sh` for faster updates (skips service recreation):

```bash
#!/bin/bash
PROJECT_NAME="myproject"
REPO_DIR="/home/${PROJECT_NAME}"
PROD_DIR="/opt/${PROJECT_NAME}"

cd ${REPO_DIR}
git pull

# Copy updated files
cp -r app ${PROD_DIR}/ 2>/dev/null || true
cp -r components ${PROD_DIR}/ 2>/dev/null || true
cp -r lib ${PROD_DIR}/ 2>/dev/null || true
cp -r public ${PROD_DIR}/ 2>/dev/null || true

cd ${PROD_DIR}
yarn install --production=false
yarn build
sudo systemctl restart ${PROJECT_NAME}

echo "✅ Update complete!"
```

---

## 🆘 TROUBLESHOOTING

### Site shows 404
- Check if service is running: `systemctl status {project-name}`
- Check if .next folder exists: `ls /opt/{project-name}/.next`
- Rebuild: `cd /opt/{project-name} && yarn build`

### Site shows 502 Bad Gateway
- Node.js app crashed. Check logs: `journalctl -u {project-name} -f`
- Usually missing environment variables or dependency issues

### Service won't start
- Check logs: `journalctl -u {project-name} -n 50`
- Verify .env file exists and has correct values
- Make sure port isn't already in use: `netstat -tlnp | grep {PORT}`

### Changes not showing
- Clear browser cache
- Rebuild and restart: `yarn build && sudo systemctl restart {project-name}`

---

## 📞 SERVER DETAILS

- **Server User:** ezloaduni2
- **Public HTML:** /home/ezloaduni2/public_html/
- **MongoDB:** Running locally on default port 27017
- **Node.js:** Installed via yarn
- **Available Ports:** 3002+ (3000 may be reserved)

---

**Last Updated:** March 2026
**Created After:** Many hours debugging Apache proxy issues 😅
