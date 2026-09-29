#!/bin/bash
# allinssl 开发运行脚本：前端产物过期时自动重建，然后 go run
# 用法：./script/run.sh [go run 参数...]

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FRONTEND_SRC="frontend/apps/allin-ssl/src"
FRONTEND_DIST="frontend/apps/allin-ssl/dist"
STATIC_BUILD="static/build"

needs_build() {
  # 无产物或源码比产物新 → 需要构建
  [ ! -f "$STATIC_BUILD/index.html" ] && return 0
  [ "$(find "$FRONTEND_SRC" -type f -newer "$STATIC_BUILD/index.html" 2>/dev/null | head -1)" != "" ] && return 0
  return 1
}

if needs_build; then
  echo "==> 前端源码已更新，重建前端..."
  # workspace 包（@baota/*）dist 缺失时先构建（vite-plugin-dts 依赖 utils 等类型声明）
  if [ ! -f "frontend/packages/utils/dist/string.d.ts" ] || [ ! -f "frontend/packages/vue/router/dist/index.d.ts" ]; then
    echo "==> workspace 包 dist 缺失，先构建..."
    (cd frontend && pnpm -r build)
  fi
  (cd frontend/apps/allin-ssl && pnpm build)
  rm -rf "$STATIC_BUILD"
  cp -r "$FRONTEND_DIST" "$STATIC_BUILD"
  # index.html 引用 /favicon.ico，vite 不会自动复制，手动带上
  cp frontend/favicon.ico "$STATIC_BUILD/favicon.ico"
  echo "==> 前端产物已同步到 $STATIC_BUILD"
else
  echo "==> 前端产物为最新，跳过前端构建"
fi

exec go run ./cmd "$@"
