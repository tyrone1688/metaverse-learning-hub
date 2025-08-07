@echo off
title 停止数字馆项目服务
color 0C
echo ========================================
echo           停止数字馆项目服务
echo ========================================
echo.

echo 正在停止所有相关进程...
echo.

:: 停止 Node.js 进程
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 echo ✅ Node.js 进程已停止

:: 停止 Redis 进程
taskkill /f /im redis-server.exe 2>nul
if %errorlevel% equ 0 echo ✅ Redis 进程已停止

echo.
echo ========================================
echo 🛑 数字馆项目服务已停止
echo ========================================
echo.
pause