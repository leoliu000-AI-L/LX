# OpenClaw 多智能体飞书机器人配置教程（保姆级）

本文档详细介绍如何配置 OpenClaw 飞书机器人，实现：
1. 读取和回复所有群消息
2. @机器人时自动转单聊
3. 多智能体共享记忆

---

## 一、前置条件

### 1.1 环境要求
- 已安装 OpenClaw（v2026.2.13+）
- 飞书企业账号
- 公网服务器或内网穿透工具（ngrok/frp）

### 1.2 创建飞书应用

**步骤 1：创建应用**
1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击「创建应用」→「企业自建应用」
3. 填写应用名称：如 "OpenClaw Bot"
4. 记录 **App ID** 和 **App Secret**

**步骤 2：配置权限（关键）**

进入「权限管理」，申请以下权限：

| 权限名称 | 权限代码 | 用途 |
|---------|---------|------|
| 读取用户发给机器人的单聊消息 | `im:message:readonly` | 接收单聊消息 |
| 获取群组中所有消息 | `im:message.group_msg` | 读取群聊所有消息 |
| 获取与发送单聊、群组消息 | `im:message:send` | 发送消息 |
| 获取群组信息 | `im:chat:readonly` | 读取群信息 |
| 获取用户基本信息 | `contact:user.base:readonly` | 获取用户信息 |

**步骤 3：配置事件订阅**

进入「事件订阅」→「添加事件」：

| 事件 | 用途 |
|-----|------|
| `im.message.receive_v1` | 接收单聊消息 |
| 接收群聊中@机器人消息事件 | 群聊@触发 |
| 获取群组中所有消息 | 读取所有群消息 |
| `im.chat.member.bot.added_v1` | 机器人进群通知 |
| `im.chat.member.bot.deleted_v1` | 机器人出群通知 |

**步骤 4：配置回调地址**

1. 启动 ngrok（或配置公网服务器）
   ```bash
   ngrok http 3000
   ```

2. 复制 https 地址，如：`https://xxx.ngrok-free.app`

3. 飞书后台填写回调地址：
   ```
   https://xxx.ngrok-free.app/webhook/feishu
   ```

4. 点击「验证」按钮，确保显示「已验证」

**步骤 5：发布应用**
- 进入「版本管理与发布」
- 创建版本 → 申请发布
- 管理员审批通过

---

## 二、OpenClaw 配置

### 2.1 基础配置

编辑 `~/.openclaw/config.yaml`：

```yaml
# 飞书频道配置
channels:
  feishu:
    enabled: true
    app_id: "cli_xxxxxxxxxxxxxxxx"      # 你的 App ID
    app_secret: "xxxxxxxxxxxxxxxx"      # 你的 App Secret
    encrypt_key: "xxxxxxxx"              # 事件订阅加密密钥
    verification_token: "xxxxxx"         # 验证 Token
    
    # 关键：群聊消息策略
    # "all" = 接收所有群消息（需要敏感权限）
    # "mention" = 仅接收@机器人的消息
    # "none" = 不接收群消息
    groupPolicy: "all"
    
    # 允许所有群（配合 groupPolicy: "all"）
    groupAllowlist: "*"
    
    # 或指定特定群组
    # groupAllowlist:
    #   - "oc_xxxxxxxxxxxxxxxx"  # 群ID

# Gateway 配置
gateway:
  base_url: "https://xxx.ngrok-free.app"  # 你的公网地址
  bind: "0.0.0.0:3000"
  
  # 飞书 webhook 路径
  inputs:
    - type: feishu
      path: "/webhook/feishu"

# 日志配置
logging:
  level: info
```

### 2.2 多智能体配置

配置不同场景下的 Agent：

```yaml
agents:
  # 默认 Agent（群聊通用）
  - id: default
    model: kimi-coding/k2p5
    skills: ["web_search", "kimi_search", "feishu-doc"]
    system_prompt: |
      你是群聊助手，可以回答技术问题、搜索信息、操作飞书文档。
      在群聊中保持简洁，不要过度回复。

  # 单聊 Agent（深度对话）
  - id: personal
    model: kimi-coding/k2p5
    thinking: on
    skills: ["memory-system", "feishu-doc", "feishu-wiki"]
    system_prompt: |
      你是个人助理，可以进行深度对话、管理记忆、处理复杂任务。
      单聊模式下可以访问用户的长期记忆。

  # 代码助手
  - id: coder
    model: kimi-coding/k2p5
    thinking: on
    skills: ["skill-creator", "clawhub", "tmux"]
    system_prompt: |
      你是代码专家，擅长编程、调试、部署。

  # 研究助手
  - id: research
    model: kimi-coding/k2p5
    skills: ["web_search", "kimi_search", "kimi_fetch"]
    system_prompt: |
      你是研究助手，擅长信息搜集、分析、总结。
```

### 2.3 智能体路由配置

```yaml
channels:
  feishu:
    # ... 基础配置 ...
    
    # 按会话类型路由
    routing:
      # 默认 Agent
      default: "default"
      
      # 单聊路由
      p2p: "personal"
      
      # 群聊路由（可以按群ID细分）
      group: "default"
      
      # 特定群组路由
      by_group:
        "oc_xxxxxxxxxxxxxxxx": "coder"      # 技术群
        "oc_yyyyyyyyyyyyyyyy": "research"   # 研究群
      
      # 特定用户路由
      by_user:
        "ou_admin": "admin"
```

---

## 三、共享记忆配置

### 3.1 启用记忆系统

```yaml
# 安装记忆系统技能
# openclaw skill install memory-system

agents:
  - id: personal
    model: kimi-coding/k2p5
    skills: ["memory-system", "feishu-doc"]
    
    # 记忆配置
    memory:
      enabled: true
      storage: "file"  # 或 "sqlite"
      path: "~/.openclaw/memory"
      
      # 共享记忆（所有 Agent 可访问）
      shared: true
      
      # 自动保存关键信息
      auto_save: true
```

### 3.2 记忆文件结构

```
~/.openclaw/memory/
├── shared/                    # 共享记忆
│   ├── important_facts.md     # 重要事实
│   ├── user_preferences.md    # 用户偏好
│   └── project_status.md      # 项目状态
├── users/                     # 用户专属记忆
│   └── ou_xxxxxxxx/           # 用户ID
│       ├── profile.md         # 用户档案
│       ├── conversations/     # 对话历史
│       └── preferences.md     # 个人偏好
└── sessions/                  # 会话记忆
    └── session_xxx.md
```

### 3.3 记忆同步机制

```yaml
# 记忆同步配置
memory:
  sync:
    # 跨会话同步
    cross_session: true
    
    # 跨 Agent 同步
    cross_agent: true
    
    # 同步间隔
    interval: 300  # 5分钟
    
    # 冲突解决策略
    conflict_resolution: "latest"  # 或 "merge"
```

---

## 四、群聊与单聊切换机制

### 4.1 自动切换逻辑

```yaml
channels:
  feishu:
    # ... 基础配置 ...
    
    # 单聊触发条件
    p2p_trigger:
      # 群聊中@机器人后，自动创建单聊会话
      auto_create_p2p: true
      
      # 单聊会话有效期
      session_ttl: 3600  # 1小时
      
      # 切换提示语
      switch_message: "已切换到私聊模式，可以继续深入讨论。"

    # 群聊行为
    group_behavior:
      # 群聊中只回复@的消息
      mention_only: false  # true = 只回复@，false = 回复所有
      
      # 群聊回复长度限制
      max_length: 500
      
      # 自动创建单聊的条件
      auto_p2p_conditions:
        - "需要深度讨论"
        - "涉及敏感信息"
        - "需要访问个人记忆"
```

### 4.2 会话状态管理

```javascript
// 会话状态示例
{
  "session_id": "sess_xxx",
  "type": "group",  // 或 "p2p"
  "user_id": "ou_xxx",
  "chat_id": "oc_xxx",
  "agent_id": "default",
  "context": {
    "messages": [...],
    "memory_refs": [...],
    "tools_used": [...]
  },
  "created_at": "2026-02-23T10:00:00Z",
  "last_active": "2026-02-23T10:30:00Z",
  "ttl": 3600
}
```

---

## 五、完整配置示例

```yaml
# ~/.openclaw/config.yaml - 完整版

# Gateway 配置
gateway:
  base_url: "https://your-domain.ngrok-free.app"
  bind: "0.0.0.0:3000"
  trustedProxies: ["127.0.0.1"]

# 频道配置
channels:
  feishu:
    enabled: true
    app_id: "cli_xxxxxxxxxxxxxxxx"
    app_secret: "xxxxxxxxxxxxxxxx"
    encrypt_key: "xxxxxxxx"
    verification_token: "xxxxxx"
    
    # 群聊策略
    groupPolicy: "all"
    groupAllowlist: "*"
    
    # 路由配置
    routing:
      default: "default"
      p2p: "personal"
      group: "default"
      by_group:
        "oc_tech_group": "coder"
        "oc_research_group": "research"
    
    # 单聊切换
    p2p_trigger:
      auto_create_p2p: true
      session_ttl: 3600
      switch_message: "已切换到私聊模式。"
    
    # 群聊行为
    group_behavior:
      mention_only: false
      max_length: 500

# Agent 配置
agents:
  - id: default
    model: kimi-coding/k2p5
    skills: ["web_search", "kimi_search", "feishu-doc"]
    memory:
      enabled: true
      shared: true

  - id: personal
    model: kimi-coding/k2p5
    thinking: on
    skills: ["memory-system", "feishu-doc", "feishu-wiki"]
    memory:
      enabled: true
      shared: true
      auto_save: true

  - id: coder
    model: kimi-coding/k2p5
    thinking: on
    skills: ["skill-creator", "clawhub", "tmux"]

  - id: research
    model: kimi-coding/k2p5
    skills: ["web_search", "kimi_search", "kimi_fetch"]

# 日志配置
logging:
  level: info
```

---

## 六、启动与测试

### 6.1 启动 OpenClaw

```bash
# 启动 Gateway
openclaw gateway start

# 或后台运行
openclaw gateway start --daemon

# 查看状态
openclaw status
```

### 6.2 测试群聊功能

1. **添加机器人进群**
   - 飞书群设置 → 添加成员
   - 搜索机器人名称，添加

2. **测试@功能**
   - 在群里 @机器人 发送消息
   - 检查是否正常回复

3. **测试自动单聊**
   - 在群里发送 "需要深入讨论"
   - 检查是否自动创建单聊会话

### 6.3 测试记忆共享

1. 在单聊中告诉机器人一些信息
2. 在群聊中询问相关信息
3. 检查是否能正确回忆

---

## 七、常见问题

### Q1: 群消息收不到
- 检查 `groupPolicy` 是否为 `"all"`
- 检查是否申请了 `im:message.group_msg` 权限
- 检查回调地址是否验证通过

### Q2: 无法发送消息
- 检查是否申请了 `im:message:send` 权限
- 检查机器人是否在群里

### Q3: 记忆不共享
- 检查 `memory.shared` 是否为 `true`
- 检查记忆文件路径是否正确
- 检查文件权限

### Q4: 单聊切换失败
- 检查 `p2p_trigger.auto_create_p2p` 是否为 `true`
- 检查用户是否允许机器人私聊

---

## 八、相关资源

- [飞书开放平台文档](https://open.feishu.cn/document/)
- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [飞书消息 API](https://open.feishu.cn/document/server-docs/im-v1/message/introduction)

---

*本文档由 OpenClaw 自动生成*  
*生成时间：2026-02-23*