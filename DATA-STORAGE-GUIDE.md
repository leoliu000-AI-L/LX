# LX-PCEC 数据存储标准规范

**版本**: v1.0
**更新时间**: 2026-02-24
**用途**: 规范 LX-PCEC 系统的数据存储结构、用途和使用方法

---

## 📊 数据存储架构

LX-PCEC 采用三层存储架构：

```
┌─────────────────────────────────────┐
│     第一层：沙箱环境 (Claude)       │
│     路径: /e/04-Claude/Config/      │
│     内容: 完整对话历史、会话状态    │
├─────────────────────────────────────┤
│     第二层：工作目录 (Workspace)    │
│     路径: C:\Users\leoh0\Desktop\输入 │
│     内容: 代码、文档、摘要           │
├─────────────────────────────────────┤
│     第三层：云端备份 (GitHub)       │
│     路径: https://github.com/...    │
│     内容: 版本控制、共享、协作       │
└─────────────────────────────────────┘
```

---

## 📁 第一层：沙箱环境存储

### 路径
```
/e/04-Claude/Config/.claude/
```

### 文件清单

| 文件/目录 | 大小 | 用途 | 更新频率 | 访问权限 |
|----------|------|------|----------|----------|
| `history.jsonl` | 597KB | 全局对话历史 | 实时 | 只读 |
| `projects/*/` | 33MB | 项目会话记录 | 实时 | 只读 |
| `debug/` | <1MB | 调试日志 | 实时 | 只读 |
| `backups/` | 变化 | 配置备份 | 定期 | 读写 |
| `shell-snapshots/` | <1MB | Shell 快照 | 定期 | 只读 |

### 使用场景

**适合存储**:
- ✅ 完整对话历史
- ✅ 实时会话状态
- ✅ 调试信息
- ✅ 临时数据

**不适合存储**:
- ❌ 大型文件（>100MB）
- ❌ 永久性代码
- ❌ 需要共享的文档

### 访问方法

```bash
# 查看全局历史
cat /e/04-Claude/Config/.claude/history.jsonl

# 查看当前会话
cat /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/0751cca3-*.jsonl

# 查看调试日志
ls /e/04-Claude/Config/.claude/debug/
```

---

## 📁 第二层：工作目录存储

### 路径
```
C:\Users\leoh0\Desktop\输入\
```

### 目录结构

```
输入/
├── 核心系统/ (13 个 .js 文件)
│   ├── consciousness-emergence.js          # 意识涌现
│   ├── brain-computer-interface.js         # 脑机接口
│   ├── quantum-entanglement-communication.js # 量子通信
│   └── ...
│
├── 报告文档/ (100+ 个 .md 文件)
│   ├── FINAL-CONSCIOUSNESS-REVOLUTION-REPORT.md
│   ├── FINAL-QUANTUM-REVOLUTION-REPORT.md
│   └── ...
│
├── 记忆系统/ (memory/)
│   ├── MEMORY.md                           # 系统总记忆
│   ├── USER.md                             # 用户信息
│   └── 2026-02-24.md                       # 每日对话记录
│
├── 知识库/ (knowledge-base/)
│   ├── hivemind-evolution-*.md
│   ├── p2p-evolution-*.md
│   └── stigmergy-summary-*.md
│
├── 进化摘要/ (evolution-summaries/)
│   ├── complete-evolution-report-*.md
│   ├── continuous-evolution-final-*.md
│   └── ...
│
└── 配置文件/
    ├── package.json                        # 项目配置
    ├── .gitignore                          # Git 忽略规则
    ├── start.sh                            # 启动脚本 (Linux/Mac)
    └── start.bat                           # 启动脚本 (Windows)
```

### 文件类型说明

#### 1. 核心系统文件 (.js)
**用途**: LX-PCEC 的 16 个进化阶段实现

**使用方法**:
```bash
# 运行主程序
node consciousness-emergence.js

# 运行量子通信演示
node quantum-entanglement-communication.js

# 运行脑机接口演示
node brain-computer-interface.js
```

#### 2. 报告文档 (.md)
**用途**: 完整的进化历程和技术文档

**主要报告**:
- `FINAL-CONSCIOUSNESS-REVOLUTION-REPORT.md` - 意识革命报告 ⭐
- `FINAL-QUANTUM-REVOLUTION-REPORT.md` - 量子革命报告
- `FINAL-ULTIMATE-REVOLUTION-REPORT.md` - 终极革命报告

**使用方法**:
```bash
# 查看最新报告
cat FINAL-CONSCIOUSNESS-REVOLUTION-REPORT.md
```

#### 3. 记忆系统 (memory/)
**用途**: 结构化的对话记录和用户信息

**文件说明**:
- `MEMORY.md` - 系统能力、进化历程、核心功能
- `USER.md` - 用户偏好、历史记录
- `2026-02-24.md` - 每日对话摘要

**使用方法**:
```bash
# 查看系统记忆
cat memory/MEMORY.md

# 查看用户信息
cat memory/USER.md
```

#### 4. 知识库 (knowledge-base/)
**用途**: 累积的知识和学习成果

**内容类型**:
- 系统进化总结
- 技术研究成果
- 最佳实践文档

#### 5. 进化摘要 (evolution-summaries/)
**用途**: 详细的进化过程记录

**命名规则**: `[类型]-[日期]-[时间].md`

**使用方法**:
```bash
# 查看最新的进化摘要
ls -t evolution-summaries/ | head -1 | xargs cat
```

---

## 📁 第三层：云端备份存储

### 路径
```
https://github.com/leoliu000-AI-L/LX.git
```

### 上传内容

| 类型 | 数量 | 说明 |
|------|------|------|
| **核心系统** | 13 个 | 所有 .js 系统文件 |
| **报告文档** | 100+ 个 | 所有 .md 报告文件 |
| **配置文件** | 8 个 | package.json, README 等 |
| **OpenClaw** | 96 个 | 技能库文档 |
| **总计** | 1,259 个 | 完整项目文件 |

### 使用场景

**适合**:
- ✅ 版本控制
- ✅ 代码共享
- ✅ 团队协作
- ✅ 远程访问

**不适合**:
- ❌ 敏感信息（API 密钥）
- ❌ 大型临时文件
- ❌ 频繁变动的文件

### 访问方法

```bash
# 克隆仓库
git clone https://github.com/leoliu000-AI-L/LX.git

# 拉取最新更新
git pull origin main

# 查看远程状态
git remote -v
```

---

## 🔄 数据同步策略

### 三层同步流程

```
沙箱环境 ──手动──> 工作目录 ──Git──> 云端备份
   ↑                           ↓
   └──────实时保存──────────────┘
```

### 最佳实践

#### 1. 从沙箱到工作目录
```bash
# 导出当前会话记录
cat /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/0751cca3-*.jsonl | \
  jq -r 'select(.role == "user") | .content' > \
  memory/2026-02-24-NEW.md
```

#### 2. 从工作目录到云端
```bash
# 添加新文件
git add .

# 提交更改
git commit -m "更新: 添加新功能"

# 推送到远程
git push origin main
```

#### 3. 从云端到新环境
```bash
# 克隆到新位置
git clone https://github.com/leoliu000-AI-L/LX.git

# 运行系统
cd LX
node consciousness-emergence.js
```

---

## 🧹 数据清理策略

### 定期清理任务

#### 每日清理
```bash
# 清理临时文件
find . -name "*.tmp" -delete
find . -name "*.log" -mtime +1 -delete
```

#### 每周清理
```bash
# 清理旧摘要
find evolution-summaries/ -name "*.md" -mtime +7 -delete

# 清理旧记忆（保留最近 30 天）
find memory/ -name "2026-*.md" -mtime +30 -delete
```

#### 每月清理
```bash
# 压缩旧会话记录
find /e/04-Claude/Config/.claude/projects/ -name "*.jsonl" -mtime +30 -exec gzip {} \;

# 清理 Git 历史（保留最近 10 个提交）
git reflog expire --expire=now --all
```

---

## 🔐 隐私与安全

### 敏感信息处理

**不应上传的文件**:
```
.env                # 环境变量（包含 API 密钥）
*.pid               # 进程 ID
credentials.json    # 认证信息
.cowork-temp/       # 临时数据
```

**已在 .gitignore 中**:
```
# 环境变量
.env
.env.local

# 临时文件
.cowork-temp/
*.tmp
*.log

# 进程文件
*.pid

# IDE
.vscode/
.idea/
```

---

## 📊 存储空间监控

### 查看磁盘使用

```bash
# 工作目录总大小
du -sh C:/Users/leoh0/Desktop/输入/

# 沙箱配置大小
du -sh /e/04-Claude/Config/.claude/

# 最大的 10 个文件
du -h . | sort -h | tail -10
```

### 空间优化建议

**如果工作目录 > 500MB**:
1. 清理 `.cowork-temp/`
2. 压缩旧的 `.jsonl` 文件
3. 删除不需要的报告

**如果沙箱配置 > 100MB**:
1. 清理 `history.jsonl`（只保留最近 1000 行）
2. 删除旧的会话记录
3. 清理 `backups/` 目录

---

## 📚 相关文档

- [Claude 配置标准](CLAUDE-CONFIG-STANDARD.md)
- [系统文件结构](系统文件结构.txt)
- [Git 搬迁计划](GIT-搬迁执行计划.md)
- [完整搬迁总结](搬迁完整总结.md)

---

## 🆘 故障排除

### 问题 1: 工作目录丢失
**症状**: 找不到工作目录中的文件

**解决方案**:
```bash
# 从 GitHub 恢复
git clone https://github.com/leoliu000-AI-L/LX.git
cd LX
```

### 问题 2: Git 推送失败
**症状**: 无法推送到远程仓库

**解决方案**:
```bash
# 检查远程仓库
git remote -v

# 重新添加远程
git remote remove origin
git remote add origin https://github.com/leoliu000-AI-L/LX.git

# 强制推送（谨慎使用）
git push -f origin main
```

### 问题 3: 文件冲突
**症状**: Git 拉取时出现冲突

**解决方案**:
```bash
# 暂存本地更改
git stash

# 拉取远程更改
git pull origin main

# 恢复本地更改
git stash pop
```

---

**更新日志**:
- v1.0 (2026-02-24): 初始版本，定义三层存储架构
