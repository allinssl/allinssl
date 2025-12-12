#!/bin/sh
# 查找并删除当前目录及子目录下所有 node_modules 文件夹和pnpm-lock.yaml文件 和 .turbo 文件夹
find . -name "node_modules" -type d -prune -exec rm -rf {} +
find . -name "pnpm-lock.yaml" -type f -delete
find . -name "dist" -type d -prune -exec rm -rf {} +
find . -name ".turbo" -type d -prune -exec rm -rf {} +
echo "删除成功"
