# AFEX Development Server Startup Script
Write-Host "Starting AFEX Development Servers..." -ForegroundColor Green

# Function to start backend server
function Start-BackendServer {
    Write-Host "Starting Backend Server..." -ForegroundColor Yellow
    Set-Location "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
    Set-Location ".."
}

# Function to start frontend server
function Start-FrontendServer {
    Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
    Set-Location "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
    Set-Location ".."
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not available!" -ForegroundColor Red
    exit 1
}

# Check if backend directory exists
if (-not (Test-Path "backend")) {
    Write-Host "Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Check if frontend directory exists
if (-not (Test-Path "frontend")) {
    Write-Host "Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "backend"
    npm install
    Set-Location ".."
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location "frontend"
    npm install
    Set-Location ".."
}

# Start servers
Start-BackendServer
Start-Sleep -Seconds 3
Start-FrontendServer

Write-Host "Servers are starting..." -ForegroundColor Green
Write-Host "Backend: https://afoxlys.onrender.com" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow 