@echo off
title 数字馆 - 后端API服务
echo ========================================
echo         数字馆项目 - 后端API启动
echo ========================================
echo.

echo 切换到后端项目目录...
cd /d "%~dp0server\digital-museum-api"

echo 检查目录: %cd%
echo.

echo 启动后端开发服务器...
echo 服务地址: http://localhost:3000
echo API文档: http://localhost:3000/api/docs
echo.
echo 按 Ctrl+C 可停止服务
echo ========================================
echo.

npm run start:dev