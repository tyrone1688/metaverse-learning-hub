@echo off
REM ===============================
REM 一键同步本地代码到 GitHub 仓库
REM 路径：D:\Projects\metaverse-learning-hub
REM 仓库：https://github.com/tyrone1688/metaverse-learning-hub.git
REM ===============================

cd /d D:\Projects\metaverse-learning-hub

echo.
echo --- 添加所有更改 ---
git add .

echo.
set /p commit_msg=请输入提交说明（默认：自动同步）: 
if "%commit_msg%"=="" set commit_msg=自动同步

echo.
echo --- 提交代码 ---
git commit -m "%commit_msg%"

echo.
echo --- 推送到 GitHub ---
git push origin main

echo.
echo ✅ 同步完成！
pause
