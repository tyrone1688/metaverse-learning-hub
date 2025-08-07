@echo off
title 数字馆项目 - 一键启动
color 0A
echo ========================================
echo           数字馆项目 - 一键启动
echo ========================================
echo.

echo [步骤 1/4] 启动数据库服务...
call start-database.bat

echo.
echo [步骤 2/4] 等待 3 秒让数据库完全启动...
timeout /t 3 /nobreak >nul

echo [步骤 3/4] 启动后端API服务...
start "数字馆-后端API" start-backend.bat

echo.
echo [步骤 4/4] 启动前端界面...
timeout /t 5 /nobreak >nul
start "数字馆-前端界面" start-frontend.bat

echo.
echo ========================================
echo 🎉 数字馆项目启动完成！
echo.
echo 📡 后端API: http://localhost:3000
echo 📚 API文档: http://localhost:3000/api/docs  
echo 🎨 前端界面: http://localhost:5173
echo.
echo 所有服务已在新窗口中启动
echo 关闭此窗口不会影响服务运行
echo ========================================
echo.
pause