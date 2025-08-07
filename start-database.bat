@echo off
title 数字馆 - 数据库服务
echo ========================================
echo           数字馆项目 - 数据库启动
echo ========================================
echo.

echo [1/2] 启动 MongoDB 服务...
net start MongoDB
if %errorlevel% equ 0 (
    echo ✅ MongoDB 启动成功
) else (
    echo ❌ MongoDB 启动失败，请检查服务状态
)

echo.
echo [2/2] 启动 Redis 服务...
start "Redis服务" redis-server
echo ✅ Redis 启动中...

echo.
echo ========================================
echo 数据库服务启动完成！
echo MongoDB: 运行在 localhost:27017
echo Redis: 运行在 localhost:6379
echo ========================================
echo.
pause