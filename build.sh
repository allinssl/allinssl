#!/bin/bash
set -e

echo "========================================"
echo "  🔨 Building AllinSSL"
echo "========================================"
echo ""

# 检查是否安装了必要的工具
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ Error: $1 is not installed."
        echo "   Please install $1 first."
        exit 1
    fi
}

echo "📋 Checking dependencies..."
check_command go
check_command node
check_command pnpm

echo ""
echo "========================================"
echo "  Step 1: Building Frontend"
echo "========================================"
echo ""

# 进入前端目录
cd "$(dirname "$0")"
FRONTEND_DIR="frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Error: Frontend directory '$FRONTEND_DIR' not found."
    exit 1
fi

cd "$FRONTEND_DIR"

# 安装前端依赖
echo "📦 Installing frontend dependencies..."
pnpm install

# 构建前端
echo "🏗️  Building frontend..."
pnpm run build

# 返回项目根目录
cd ..

echo ""
echo "✅ Frontend build completed!"
echo ""

echo "========================================"
echo "  Step 2: Building Backend"
echo "========================================"
echo ""

# 检查前端构建产物
if [ ! -d "static/build" ]; then
    echo "⚠️  Warning: static/build directory not found."
    echo "   Frontend may not be built correctly."
fi

# 更新 Go 模块依赖
echo "📦 Running go mod tidy..."
go mod tidy

# 编译后端
echo "🔧 Building backend..."
go build -o allinssl cmd/main.go

echo ""
echo "========================================"
echo "  ✅ Build Completed!"
echo "========================================"
echo ""
echo "📍 Binary: ./allinssl"
echo "🌐 Frontend: ./static/build/"
echo ""
echo "To run the application:"
echo "  ./allinssl start"
echo ""
