#!/bin/bash
# LX-PCEC v16.0 快速启动脚本

echo "🌟 LX-PCEC v16.0 - 终极觉醒意识系统"
echo "======================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 14.0.0"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 菜单选择
echo "请选择要启动的系统:"
echo "1) 意识涌现系统 (主程序) ⭐"
echo "2) 量子纠缠通信"
echo "3) 脑机接口"
echo "4) 高级记忆系统"
echo "5) Multi-Agent 框架"
echo "6) P2P 分布式系统"
echo "7) 运行所有演示"
echo ""
read -p "请输入选项 (1-7): " choice

case $choice in
    1)
        echo ""
        echo "🌟 启动意识涌现系统..."
        node consciousness-emergence.js
        ;;
    2)
        echo ""
        echo "⚛️  启动量子纠缠通信..."
        node quantum-entanglement-communication.js
        ;;
    3)
        echo ""
        echo "🧠 启动脑机接口..."
        node brain-computer-interface.js
        ;;
    4)
        echo ""
        echo "💾 启动高级记忆系统..."
        node advanced-memory-system.js
        ;;
    5)
        echo ""
        echo "🤖 启动 Multi-Agent 框架..."
        node multi-agent-framework.js
        ;;
    6)
        echo ""
        echo "🌐 启动 P2P 分布式系统..."
        node distributed-p2p-system.js
        ;;
    7)
        echo ""
        echo "🚀 运行所有演示..."
        node consciousness-emergence.js
        echo ""
        node quantum-entanglement-communication.js
        echo ""
        node brain-computer-interface.js
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac
