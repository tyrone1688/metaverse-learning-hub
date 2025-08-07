@echo off
title 数字馆 - 前端界面
echo ========================================
echo         数字馆项目 - 前端界面启动
echo ========================================
echo.

echo 切换到前端项目目录...
cd /d "%~dp0client-web\digital-museum-web"

echo 检查目录: %cd%
echo.

echo 启动前端开发服务器...
echo 界面地址: http://localhost:5173 或 http://localhost:5174
echo.
echo 按 Ctrl+C 可停止服务
echo ========================================
echo.

npm run dev