@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Building AllinSSL
echo ========================================
echo.

:: 检查是否在项目根目录
if not exist "frontend" (
    echo Error: Frontend directory not found.
    echo Please run this script from the project root directory.
    exit /b 1
)

if not exist "cmd" (
    echo Error: cmd directory not found.
    echo Please run this script from the project root directory.
    exit /b 1
)

:: 检查必要的命令
echo Checking dependencies...
where go >nul 2>&1
if errorlevel 1 (
    echo Error: Go is not installed or not in PATH.
    echo Please install Go from https://golang.org/dl/
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
    echo Error: pnpm is not installed or not in PATH.
    echo Please install pnpm: npm install -g pnpm
    exit /b 1
)

echo.
echo ========================================
echo   Step 1: Building Frontend
echo ========================================
echo.

cd frontend

:: 安装前端依赖
echo Installing frontend dependencies...
call pnpm install
if errorlevel 1 (
    echo Error: Failed to install frontend dependencies.
    cd ..
    exit /b 1
)

:: 构建前端
echo Building frontend...
call pnpm run build
if errorlevel 1 (
    echo Error: Failed to build frontend.
    cd ..
    exit /b 1
)

cd ..

echo.
echo Frontend build completed!
echo.

echo ========================================
echo   Step 2: Building Backend
echo ========================================
echo.

:: 检查前端构建产物
if not exist "static\build" (
    echo Warning: static\build directory not found.
    echo Frontend may not be built correctly.
)

:: 更新 Go 模块依赖
echo Running go mod tidy...
go mod tidy

:: 编译后端
echo Building backend...
go build -o allinssl.exe cmd\main.go
if errorlevel 1 (
    echo Error: Failed to build backend.
    exit /b 1
)

echo.
echo ========================================
echo   Build Completed!
echo ========================================
echo.
echo Binary: .\allinssl.exe
echo Frontend: .\static\build\
echo.
echo To run the application:
echo   .\allinssl start
echo.

pause
