@echo off
:: 设置编码为 UTF-8（避免中文乱码）
chcp 65001 >nul

echo ====== SnapMind 启动器 ======
echo ======= Version 1.0  =======

:: 显示字符画横幅
if exist banner.txt (
    type banner.txt
)

echo.

:: 1. 激活 Conda 环境
echo [1/4] 激活 Conda 环境...
call conda activate Flask

:: 2. 启动后端 API 服务
echo [2/4] Starting Backend API service...
start cmd /k "cd backend-api && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

:: 3. 启动 Electron 客户端
echo [3/4] Starting Electron client...
start cmd /k "cd client-electron && npm run start"

timeout /t 3 /nobreak >nul

:: 4. 启动 Web 前端
echo [4/4] Starting Web frontend (http://localhost:5173)...
start cmd /k "cd web-frontend && npm run dev"

echo.
echo ✅ 所有组件已启动，请耐心等待各窗口加载。
pause
