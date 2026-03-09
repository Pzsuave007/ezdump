<?php
/**
 * Easy Load & Dump - PHP Proxy
 * This forwards all requests to the Node.js app running on port 3002
 */

$nodeUrl = 'http://127.0.0.1:3002';

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];

// Build the full URL to the Node.js app
$url = $nodeUrl . $requestUri;

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);

// Forward the request method
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host' && strtolower($name) !== 'connection') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward POST/PUT body
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

// Check for errors
if (curl_errno($ch)) {
    http_response_code(502);
    echo 'Proxy Error: ' . curl_error($ch);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Split headers and body
$headerText = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

// Set response code
http_response_code($httpCode);

// Forward response headers (skip some that shouldn't be forwarded)
$headerLines = explode("\r\n", $headerText);
foreach ($headerLines as $header) {
    if (empty($header)) continue;
    if (stripos($header, 'HTTP/') === 0) continue;
    if (stripos($header, 'Transfer-Encoding:') === 0) continue;
    if (stripos($header, 'Connection:') === 0) continue;
    header($header);
}

// Output the body
echo $body;
