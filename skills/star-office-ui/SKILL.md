---
name: star-office-ui
description: Star Office UI 像素办公室看板，支持多 Agent 状态可视化、自定义装修、公网访问和 AI 生图功能。
---
# Star Office UI Skill

已成功部署 Star Office UI 服务：

## 访问地址
- 本地：http://127.0.0.1:19000
- 公网临时链接：https://scsi-assumptions-ebony-helps.trycloudflare.com

## 核心功能
✅ 多 Agent 状态可视化，自动切换位置
✅ 三语支持（CN/EN/JP）
✅ 自定义房间装修与资产替换
✅ AI 生图装修功能（需配置 Gemini API）
✅ 支持多 Agent 加入协作

## 默认配置
- 侧边栏密码：1234（建议修改为强密码）
- 后端服务运行在端口 19000
- 状态文件：/root/.openclaw/workspace/Star-Office-UI/state.json

## 状态切换命令
```bash
# 工作中
python3 set_state.py writing "正在处理任务"

# 同步中
python3 set_state.py syncing "同步数据中"

# 报错中
python3 set_state.py error "发现问题，正在排查"

# 待命中
python3 set_state.py idle "待命中，随时准备服务"
```
