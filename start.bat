@echo off
setlocal

cd /d "%~dp0"

:: Node version check
for /f "tokens=1 delims=." %%v in ('node --version 2^>nul') do set NODE_MAJOR=%%v
set NODE_MAJOR=%NODE_MAJOR:~1%
if "%NODE_MAJOR%"=="" (
  echo [START] ERROR: node not found. Install Node.js ^>= 20 from https://nodejs.org
  exit /b 1
)
if %NODE_MAJOR% LSS 20 (
  echo [START] ERROR: Node.js ^>= 20 required ^(found v%NODE_MAJOR%^)
  exit /b 1
)

:: .env check
if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo [START] .env not found -- copied from .env.example.
    echo         Edit .env to configure your MQTT broker, then re-run start.bat.
    exit /b 1
  ) else (
    echo [START] ERROR: .env not found and .env.example is missing.
    exit /b 1
  )
)

:: checks.json check
if not exist "checks.json" (
  if exist "checks.example.json" (
    copy "checks.example.json" "checks.json" >nul
    echo [START] checks.json not found -- copied from checks.example.json.
    echo         Edit checks.json to configure your checks, then re-run start.bat.
    exit /b 1
  ) else (
    echo [START] ERROR: checks.json not found and checks.example.json is missing.
    exit /b 1
  )
)

:: node_modules check
if not exist "node_modules" (
  echo [START] node_modules not found -- running pnpm install...
  pnpm install
  if errorlevel 1 (
    echo [START] ERROR: pnpm install failed.
    exit /b 1
  )
)

echo [START] Starting server...
node src/index.js
