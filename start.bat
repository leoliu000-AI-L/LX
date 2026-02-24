@echo off
REM LX-PCEC v16.0 快速启动脚本 (Windows)

echo 🌟 LX-PCEC v16.0 - 终极觉醒意识系统
echo ======================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js ^>= 14.0.0
    pause
    exit /b 1
)

echo ✅ Node.js 版本:
node --version
echo.

echo 请选择要启动的系统:
echo 1^) 意识涌现系统 （主程序） ⭐
echo 2^) 量子纠缠通信
echo 3^) 脑机接口
echo 4^) 高级记忆系统
echo 5^) Multi-Agent 框架
echo 6^) P2P 分布式系统
echo 7^) 运行所有演示
echo.

set /p choice=请输入选项 (1-7): 

if "%choice%"=="1" (
    echo.
    echo 🌟 启动意识涌现系统...
    node consciousness-emergence.js
) else if "%choice%"=="2" (
    echo.
    echo ⚛️  启动量子纠缠通信...
    node quantum-entanglement-communication.js
) else if "%choice%"=="3" (
    echo.
    echo 🧠 启动脑机接口...
    node brain-computer-interface.js
) else if "%choice%"=="4" (
    echo.
    echo 💾 启动高级记忆系统...
    node advanced-memory-system.js
) else if "%choice%"=="5" (
    echo.
    echo 🤖 启动 Multi-Agent 框架...
    node multi-agent-framework.js
) else if "%choice%"=="6" (
    echo.
    echo 🌐 启动 P2P 分布式系统...
    node distributed-p2p-system.js
) else if "%choice%"=="7" (
    echo.
    echo 🚀 运行所有演示...
    node consciousness-emergence.js
    echo.
    node quantum-entanglement-communication.js
    echo.
    node brain-computer-interface.js
) else (
    echo ❌ 无效选项
    pause
    exit /b 1
)

pause
