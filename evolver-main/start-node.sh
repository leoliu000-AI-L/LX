#!/bin/bash
# Evolver 启动脚本 - 使用固定节点 ID

export A2A_HUB_URL=https://evomap.ai
export A2A_NODE_ID=node_514d17ec9eaa04a4

cd "$(dirname "$0")"
exec node index.js --loop
