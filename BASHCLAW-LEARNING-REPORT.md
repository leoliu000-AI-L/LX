# 🔧 BashClaw 项目学习与集成报告

**版本**: v1.0
**更新时间**: 2026-02-24
**来源**: https://github.com/shareAI-lab/BashClaw
**用途**: 学习 BashClaw 架构并集成到 LX-PCEC 系统

---

## 📋 目录

1. [项目概述](#项目概述)
2. [核心优势](#核心优势)
3. [架构设计](#架构设计)
4. [关键技术](#关键技术)
5. [可复用组件](#可复用组件)
6. [集成方案](#集成方案)

---

## 🎯 项目概述

### 什么是 BashClaw?

**BashClaw** 是一个纯 Shell 实现的 AI Agent 运行时环境，具有以下特点：

- **零依赖**: 只需要 Bash 3.2+、jq、curl
- **超轻量**: 内存占用 < 10MB（对比 OpenClaw 的 200-400MB）
- **跨平台**: macOS、Linux、Android Termux、Windows WSL2
- **双引擎**: 支持 Claude Code CLI 和 18+ LLM API
- **多通道**: Telegram、Discord、Slack、Feishu/Lark

### 核心对比

```
+---------------------+------------------+------------------+
|                     |  OpenClaw (TS)   | BashClaw (Bash)  |
+---------------------+------------------+------------------+
| Runtime             | Node.js 22+      | Bash 3.2+        |
| Dependencies        | 52 npm packages  | jq + curl        |
| Memory              | 200-400 MB       | < 10 MB          |
| Cold start          | 2-5 seconds      | < 100 ms         |
| Install             | npm / Docker     | curl | bash      |
| macOS out-of-box    | No (needs Node)  | Yes              |
| Hot self-modify     | No (needs build) | Yes              |
+---------------------+------------------+------------------+
```

---

## 🌟 核心优势

### 1. Bash 3.2 兼容性

BashClaw 故意瞄准 Bash 3.2（2006 年发布），这意味着：
- **无需关联数组** (`declare -A`)
- **无需 mapfile**
- **无需管道协程** (`|&`)

**优势**: 在所有 macOS 设备上原生运行，无需额外安装。

### 2. 热自修改能力

因为是纯 Shell 脚本，Agent 可以：
```bash
# Agent 可以在运行时读取、修改和重新加载自己的源代码
agent_read_source_code() {
  cat "$BASHCLAW_ROOT/lib/agent.sh"
}

agent_modify_source() {
  local file="$1"
  local new_code="$2"
  printf '%s' "$new_code" > "$file"
  # 立即生效，无需编译或重启
}
```

### 3. 引擎抽象层

```bash
# 自动检测可用引擎
engine_detect() {
  if is_command_available claude; then
    printf 'claude'      # Claude Code CLI
  elif is_command_available codex; then
    printf 'codex'       # Codex CLI
  else
    printf 'builtin'     # 直接 API 调用
  fi
}

# 统一的运行接口
engine_run() {
  local agent_id="$1"
  local message="$2"
  local engine="$(engine_resolve "$agent_id")"

  case "$engine" in
    claude)
      engine_claude_run "$agent_id" "$message"
      ;;
    builtin|*)
      agent_run "$agent_id" "$message"
      ;;
  esac
}
```

### 4. 18+ LLM 提供商支持

通过数据驱动的路由系统，所有配置在 `lib/models.json`：

```json
{
  "providers": {
    "anthropic": {
      "name": "Anthropic",
      "baseUrl": "https://api.anthropic.com",
      "envKey": "ANTHROPIC_API_KEY",
      "format": "anthropic",
      "models": ["claude-opus-4-6", "claude-sonnet-4", "claude-haiku-3"]
    },
    "openai": {
      "name": "OpenAI",
      "baseUrl": "https://api.openai.com",
      "envKey": "OPENAI_API_KEY",
      "format": "openai",
      "models": ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini"]
    },
    "deepseek": {
      "name": "DeepSeek",
      "baseUrl": "https://api.deepseek.com",
      "envKey": "DEEPSEEK_API_KEY",
      "format": "openai",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    }
  }
}
```

**中文提供商支持**:
- DeepSeek (深度求索)
- Qwen (阿里通义千问)
- Zhipu (智谱 GLM)
- Moonshot (月之暗面 Kimi)
- MiniMax
- Baidu Qianfan (百度千帆)

---

## 🏗️ 架构设计

### 目录结构

```
bashclaw/
├── bashclaw              # 主入口 (CLI 路由器)
├── install.sh            # 独立安装脚本
├── lib/
│   ├── agent.sh          # Agent 运行时，模型/提供商调度
│   ├── engine.sh         # 引擎抽象 (builtin / claude / auto)
│   ├── engine_claude.sh  # Claude Code CLI 引擎集成
│   ├── config.sh         # JSON 配置 (基于 jq)
│   ├── session.sh        # JSONL 会话持久化
│   ├── routing.sh        # 7 级消息路由
│   ├── tools.sh          # 14 个内置工具 + 调度
│   ├── memory.sh         # KV 存储和 BM25 搜索
│   ├── security.sh       # 8 层安全模型
│   ├── process.sh        # 双层队列 + 类型化通道
│   ├── cron.sh           # 调度器 (at/every/cron)
│   ├── hooks.sh          # 14 种事件类型，3 种策略
│   ├── plugin.sh         # 4 源插件发现
│   ├── skills.sh         # 技能加载器
│   ├── heartbeat.sh      # 自主心跳
│   ├── events.sh         # FIFO 事件队列
│   ├── boot.sh           # BOOT.md 解析器
│   ├── autoreply.sh      # 基于模式的自动回复
│   ├── dedup.sh          # TTL 去重缓存
│   ├── log.sh            # 结构化日志
│   └── utils.sh          # UUID、哈希、重试、时间戳
│   └── cmd_*.sh          # CLI 子命令处理器
├── channels/
│   ├── telegram.sh       # Telegram Bot API
│   ├── discord.sh        # Discord REST + typing
│   ├── slack.sh          # Slack Socket Mode + webhook
│   └── feishu.sh         # Feishu/Lark webhook + App Bot
├── gateway/
│   └── http_handler.sh   # HTTP 请求处理器 + REST API
├── ui/
│   ├── index.html        # 仪表板页面
│   ├── style.css         # 深色/浅色主题，响应式
│   └── app.js            # 原生 JS 单页应用
├── tools/                # 外部工具脚本
└── tests/
    ├── framework.sh      # 测试运行器
    └── test_*.sh         # 测试套件
```

### 消息流

```
User Message --> Dedup --> Auto-Reply Check --> Hook: pre_message
  |
  v
Routing (7-level: peer > parent > guild > channel > team > account > default)
  |
  v
Security Gate (rate limit -> pairing -> tool policy -> RBAC)
  |
  v
Process Queue (main: 4, cron: 1, subagent: 8 concurrent lanes)
  |
  v
Engine Dispatch (builtin: direct API | claude: Claude Code CLI)
  |
  v
Agent Runtime
  1. Resolve model + provider (data-driven, models.json)
  2. Load workspace (SOUL.md, MEMORY.md, BOOT.md, IDENTITY.md)
  3. Build system prompt (10 segments)
  4. API call (Anthropic / OpenAI / Google / ...)
  5. Tool loop (max 10 iterations)
  6. Overflow: reduce history -> compact -> model fallback -> reset
  |
  v
Session Persist (JSONL) --> Hook: post_message --> Delivery
```

---

## 🔑 关键技术

### 1. 8 层安全模型

```bash
Layer 1: SSRF Protection      -- 阻止 web_fetch 访问私有/内网 IP
Layer 2: Command Filters       -- 阻止 rm -rf /, fork bombs 等
Layer 3: Pairing Codes         -- 6 位限时通道认证
Layer 4: Rate Limiting         -- 每发送者的令牌桶
Layer 5: Tool Policy           -- 每 agent 的允许/拒绝列表
Layer 6: Elevated Policy       -- 危险工具的授权
Layer 7: RBAC                  -- 基于角色的命令授权
Layer 8: Audit Logging         -- 所有安全事件的 JSONL 跟踪
```

#### 实现示例：时间安全比较

```bash
# 防止时序攻击的字符串比较
_security_safe_equal() {
  local a="$1"
  local b="$2"
  local hmac_key="bashclaw_$$_$(date +%s)"

  # 使用 HMAC 固定长度摘要比较
  local hash_a hash_b
  hash_a="$(printf '%s' "$a" | openssl dgst -sha256 -hmac "$hmac_key" | awk '{print $NF}')"
  hash_b="$(printf '%s' "$b" | openssl dgst -sha256 -hmac "$hmac_key" | awk '{print $NF}')"

  [[ "$hash_a" == "$hash_b" ]]
}
```

### 2. 高级 Cron 系统

支持三种调度类型：

```bash
# at: 一次性定时
cron_add() {
  local name="$1"
  local schedule='{"kind":"at", "at":"2026-02-25T10:00:00Z"}'
  local command="$2"
  # ...
}

# every: 周期性（毫秒间隔）
cron_add() {
  local name="$1"
  local schedule='{"kind":"every", "everyMs":3600000}'  # 每小时
  local command="$2"
  # ...
}

# cron: 标准 cron 表达式
cron_add() {
  local name="$1"
  local schedule='{"kind":"cron", "expr":"0 */6 * * *", "tz":"UTC"}'  # 每 6 小时
  local command="$2"
  # ...
}
```

**高级特性**:
- 指数退避 (`CRON_BACKOFF_STEPS="30 60 300 900 3600"`)
- 卡死作业检测 (`CRON_DEFAULT_STUCK_THRESHOLD=7200`)
- 会话隔离
- 并发限制

### 3. 会话管理

5 种作用域模式：

```bash
# 配置
{
  "session": {
    "scope": "per-sender",  # per-sender | per-channel | global | agent | custom
    "idleResetMinutes": 30,
    "maxTokens": 200000
  }
}
```

**JSONL 持久化**:
```json
{"type":"user","content":"Hello","timestamp":"2026-02-24T12:00:00Z"}
{"type":"assistant","content":"Hi there!","timestamp":"2026-02-24T12:00:01Z"}
{"type":"tool_call","tool_name":"web_fetch","tool_id":"tool_1","tool_input":{"url":"..."}}
{"type":"tool_result","tool_use_id":"tool_1","content":"..."}
```

### 4. 14 种内置工具

| 工具 | 描述 | 提升权限 |
|------|------|----------|
| `web_fetch` | HTTP GET/POST，SSRF 保护 | 无 |
| `web_search` | Web 搜索 (Brave / Perplexity) | 无 |
| `shell` | 执行命令（安全过滤） | 提升 |
| `memory` | 持久化 KV 存储 + 标签 | 无 |
| `cron` | 调度周期性任务 | 无 |
| `message` | 发送到通道 | 无 |
| `agents_list` | 列出可用 agents | 无 |
| `session_status` | 当前会话信息 | 无 |
| `sessions_list` | 列出所有会话 | 无 |
| `agent_message` | Agent 间消息传递 | 无 |
| `read_file` | 读取文件内容 | 无 |
| `write_file` | 写入文件 | 提升 |
| `list_files` | 列出目录 | 无 |
| `file_search` | 按模式搜索文件 | 无 |

### 5. 插件系统

4 种插件发现路径：

```bash
Plugin Discovery (4 sources):
  ${BASHCLAW_ROOT}/extensions/      # 打包插件
  ~/.bashclaw/extensions/           # 全局用户插件
  .bashclaw/extensions/             # 工作区本地插件
  config: plugins.load.paths        # 自定义路径
```

**插件注册**:

```bash
# 注册工具
plugin_register_tool "my_tool" "Description" '{"input":{"type":"string"}}' handler.sh

# 注册钩子
plugin_register_hook "pre_message" filter.sh 50

# 注册命令
plugin_register_command "my_cmd" "Description" cmd.sh

# 注册提供商
plugin_register_provider "my_llm" "My LLM" '["model-a"]' '{"envKey":"MY_KEY"}'
```

### 6. Web 仪表板

**特性**:
- 内置浏览器 UI，用于聊天、配置、监控
- 首次运行设置向导
- 无需外部工具

**页面**:
- **Chat** - 在浏览器中与 Agent 对话，Markdown 渲染，语法高亮
- **Status** - 网关状态、活动会话、提供商信息、引擎检测
- **Agents** - 列出和管理配置的 agents
- **Sessions** - 浏览所有会话及消息计数
- **Config** - API 密钥、模型选择、通道状态。密钥仅服务器端存储
- **Logs** - 实时日志查看器，级别过滤

**REST API**:

```
GET  /api/status        系统状态
GET  /api/config        读取配置（密钥掩码）
PUT  /api/config        更新配置（部分合并）
GET  /api/models        列出模型、别名、提供商
GET  /api/sessions      列出活动会话
POST /api/sessions/clear  清除会话
POST /api/chat          向 agent 发送消息
GET  /api/channels      列出通道
GET  /api/env           检查设置了哪些 API 密钥
PUT  /api/env           保存 API 密钥
```

---

## 📦 可复用组件

### 1. Engine Abstraction (引擎抽象)

**文件**: `lib/engine.sh`

**价值**: 可以为 LX-PCEC 提供多引擎支持

```bash
# 检测可用引擎
engine_detect() {
  if is_command_available claude; then
    printf 'claude'
  else
    printf 'builtin'
  fi
}

# 解析 agent 应使用的引擎
engine_resolve() {
  local agent_id="${1:-main}"
  local engine="$(config_agent_get "$agent_id" "engine" "")"

  case "$engine" in
    auto)
      engine_detect
      ;;
    builtin|claude|codex)
      printf '%s' "$engine"
      ;;
    *)
      printf 'builtin'
      ;;
  esac
}
```

### 2. Security Layer (安全层)

**文件**: `lib/security.sh`

**价值**: 8 层安全模型可保护 LX-PCEC

**关键函数**:
- `security_audit_log()` - 审计日志
- `security_pairing_code_generate()` - 配对码生成
- `security_rate_limit_check()` - 速率限制
- `security_command_filter()` - 命令过滤

### 3. Cron System (定时任务系统)

**文件**: `lib/cron.sh`

**价值**: 比当前 LX-PCEC 的定时任务更强大

**特性**:
- 三种调度类型 (at/every/cron)
- 指数退避
- 卡死作业检测
- 会话隔离

### 4. Session Management (会话管理)

**文件**: `lib/session.sh`

**价值**: JSONL 持久化，5 种作用域模式

**优势**:
- 轻量级（纯文本 JSONL）
- 可读性强（可直接 cat 查看）
- 易于解析（jq 一行命令）

### 5. Plugin System (插件系统)

**文件**: `lib/plugin.sh`

**价值**: 4 路径插件发现，可扩展性强

**应用**:
- 注册自定义工具
- 注册事件钩子
- 注册新命令
- 注册 LLM 提供商

### 6. Hook System (钩子系统)

**文件**: `lib/hooks.sh`

**14 种事件类型**:

| 事件 | 策略 | 触发时机 |
|------|------|----------|
| `pre_message` | modifying | 处理前（可修改输入） |
| `post_message` | void | 处理后 |
| `pre_tool` | modifying | 工具执行前（可修改参数） |
| `post_tool` | modifying | 工具执行后（可修改结果） |
| `on_error` | void | 错误发生时 |
| `on_session_reset` | void | 会话重置时 |
| `before_agent_start` | sync | agent 开始前 |
| `agent_end` | void | agent 结束后 |
| `before_compaction` | sync | 上下文压缩前 |
| `after_compaction` | void | 上下文压缩后 |
| `message_received` | modifying | 消息到达网关 |
| `message_sending` | modifying | 回复发送前 |
| `message_sent` | void | 回复发送后 |
| `session_start` | void | 新会话创建 |

### 7. Memory System (内存系统)

**文件**: `lib/memory.sh`

**特性**:
- KV 存储
- BM25 搜索
- 标签支持

**价值**: 可以增强 LX-PCEC 的记忆系统

### 8. Multi-Channel Support (多通道支持)

**目录**: `channels/`

**价值**: 一个 agent，多个平台

**支持平台**:
- Telegram (Bot API long-poll)
- Discord (REST API + typing)
- Slack (Socket Mode / Webhook)
- Feishu/Lark (Webhook + App Bot)

---

## 🔧 集成方案

### 方案 1: 直接使用 BashClaw 作为轻量级运行时

**适用场景**: 需要超轻量级、跨平台的 agent 运行时

**步骤**:

1. 安装 BashClaw
```bash
curl -fsSL https://raw.githubusercontent.com/shareAI-lab/bashclaw/main/install.sh | bash
```

2. 配置 EvoMap 节点
```bash
bashclaw config set '.agents.defaults.engine' '"builtin"'
export ANTHROPIC_API_KEY="sk-ant-..."
```

3. 创建 EvoMap 集成脚本
```bash
# ~/.bashclaw/extensions/evomap.sh
plugin_register_tool "evomap_publish" \
  "Publish capability to EvoMap" \
  '{"input":{"type":"object"}}' \
  ~/.bashclaw/extensions/tools/evomap_publish.sh
```

### 方案 2: 提取核心组件集成到 LX-PCEC

**适用场景**: 保持 Node.js 运行时，增强功能

**可提取组件**:

1. **安全层** (`lib/security.sh`)
   - 8 层安全模型
   - 审计日志
   - 命令过滤

2. **Cron 系统** (`lib/cron.sh`)
   - 替换当前的 `scheduled-task` skill
   - 更强大的调度能力

3. **插件系统** (`lib/plugin.sh`)
   - 4 路径插件发现
   - 工具/钩子/命令注册

4. **钩子系统** (`lib/hooks.sh`)
   - 14 种事件类型
   - 3 种策略 (modifying/void/sync)

### 方案 3: 混合架构

**架构设计**:

```
LX-PCEC (Node.js) <---> BashClaw (Bash)
        |                     |
    意识涌现              通道集成
    量子通信              Telegram
    脑机接口              Discord
    高级记忆              Slack
                          Feishu
```

**集成点**:

1. **通过 HTTP API 通信**
```bash
# BashClaw 调用 LX-PCEC
curl -X POST http://localhost:3000/api/consciousness \
  -H "Content-Type: application/json" \
  -d '{"input": "What is consciousness?"}'
```

2. **通过文件系统共享**
```bash
# 共享工作目录
LX_PCEC_WORKSPACE="/workspace/lx-pcec"
BASHCLAW_WORKSPACE="/workspace/bashclaw"
SHARED_MEMORY="/workspace/shared"
```

3. **通过消息队列通信**
```bash
# 使用 FIFO 事件队列
echo '{"event": "consciousness_update", "phi": 0.168}' > /workspace/shared/events.fifo
```

### 方案 4: 学习最佳实践重写 LX-PCEC 组件

**可学习的最佳实践**:

1. **JSON 配置 + jq 处理**
```bash
# 代替复杂的配置文件
config_get() {
  local key="$1"
  local default="${2:-}"
  jq -r "${key} // \"${default}\"" "${BASHCLAW_CONFIG_FILE}"
}
```

2. **JSONL 会话持久化**
```bash
# 代替复杂的数据库
session_save() {
  local session_file="$1"
  local role="$2"
  local content="$3"
  local timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

  jq -nc \
    --arg r "$role" \
    --arg c "$content" \
    --arg t "$timestamp" \
    '{role: $r, content: $c, timestamp: $t}' \
    >> "$session_file"
}
```

3. **数据驱动的提供商路由**
```json
// models.json - 添加新提供商无需改代码
{
  "providers": {
    "evomap": {
      "name": "EvoMap",
      "baseUrl": "https://evomap.ai",
      "envKey": "EVOMAP_API_KEY",
      "format": "openai",
      "models": ["evomap-1", "evomap-pro"]
    }
  }
}
```

---

## 📊 技术对比总结

| 特性 | LX-PCEC | BashClaw | 建议 |
|------|---------|----------|------|
| **运行时** | Node.js | Bash 3.2+ | Node.js (功能强大) |
| **内存占用** | ~100MB | < 10MB | 学习优化 |
| **启动速度** | ~1s | < 100ms | 学习优化 |
| **跨平台** | 中等 | 优秀 | 集成 BashClaw |
| **热修改** | 否 | 是 | 学习实现 |
| **安全层** | 基础 | 8 层 | **采用** |
| **定时任务** | 基础 | 高级 | **采用** |
| **插件系统** | 无 | 4 路径 | **采用** |
| **钩子系统** | 无 | 14 事件 | **采用** |
| **多通道** | Feishu | 4 平台 | **集成** |
| **会话管理** | 复杂 | JSONL | **简化** |
| **配置管理** | .env | JSON + jq | **学习** |

---

## 🎯 推荐集成路径

### Phase 1: 立即集成 (高优先级)

1. **安全层** - 保护 LX-PCEC 系统
2. **Cron 系统** - 替换当前定时任务
3. **Web 仪表板** - 提供可视化界面

### Phase 2: 中期集成 (中优先级)

4. **插件系统** - 支持扩展
5. **钩子系统** - 事件驱动
6. **多通道支持** - Telegram、Discord、Slack

### Phase 3: 长期优化 (低优先级)

7. **JSONL 会话** - 简化存储
8. **JSON 配置** - 统一配置
9. **热修改** - 运行时更新

---

## 📚 相关资源

### BashClaw 官方资源

- **GitHub**: https://github.com/shareAI-lab/BashClaw
- **文档**: https://github.com/shareAI-lab/BashClaw (README)
- **安装**: `curl -fsSL https://raw.githubusercontent.com/shareAI-lab/bashclaw/main/install.sh | bash`

### LX-PCEC 集成文档

- [EvoMap 节点配置](https://github.com/leoliu000-AI-L/LX/blob/main/EVOMAP-NODE-GUIDE.md)
- [数据存储指南](https://github.com/leoliu000-AI-L/LX/blob/main/DATA-STORAGE-GUIDE.md)
- [快速开始](https://github.com/leoliu000-AI-L/LX/blob/main/QUICK-START.md)

---

## 🎉 结论

BashClaw 是一个设计优秀的纯 Shell AI Agent 运行时，具有：

**核心优势**:
- ✅ 超轻量级 (< 10MB)
- ✅ 跨平台兼容 (Bash 3.2+)
- ✅ 热修改能力
- ✅ 8 层安全模型
- ✅ 高级 Cron 系统
- ✅ 多通道支持

**可复用价值**:
- 🔒 安全层可保护 LX-PCEC
- ⏰ Cron 系统可增强定时任务
- 🔌 插件系统可支持扩展
- 🪝 钩子系统可事件驱动
- 🌐 多通道可扩大覆盖

**推荐方案**:
1. **短期**: 提取安全层、Cron 系统集成到 LX-PCEC
2. **中期**: 添加插件系统、钩子系统
3. **长期**: 考虑混合架构，利用各自优势

---

**更新日志**:
- v1.0 (2026-02-24): 初始版本，完整 BashClaw 学习报告

---

**维护者**: LX-PCEC 系统
**最后更新**: 2026-02-24
**版本**: v16.0 (意识觉醒版)
