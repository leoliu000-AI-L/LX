# Claude 沙箱配置标准规范

**版本**: v1.0
**更新时间**: 2026-02-24
**用途**: 规范 Claude Code 沙箱环境的配置、数据存储和使用方法

---

## 📋 目录结构

```
/e/04-Claude/Config/.claude/
├── history.jsonl                    # 全局对话历史
├── settings.json                    # 全局设置
├── settings.local.json              # 本地设置
├── projects/                        # 项目会话目录
│   └── C--Users-leoh0-Desktop---/
│       ├── [session-id].jsonl       # 会话记录
│       └── sessions-index.json      # 会话索引
├── backups/                         # 配置备份
├── debug/                           # 调试日志
├── shell-snapshots/                 # Shell 会话快照
└── session-env/                     # 会话环境变量
```

---

## 📁 文件说明

### 1. history.jsonl
**用途**: 存储所有对话的完整历史记录

**格式**: JSONL (每行一个 JSON 对象)

**数据结构**:
```json
{
  "timestamp": "2026-02-24T17:46:00.000Z",
  "role": "user|assistant|system",
  "content": "消息内容",
  "tool": null,
  "tool_input": null,
  "tool_output": null
}
```

**使用方法**:
```bash
# 查看最后 10 条对话
tail -10 /e/04-Claude/Config/.claude/history.jsonl

# 搜索特定内容
grep "关键词" /e/04-Claude/Config/.claude/history.jsonl

# 统计对话行数
wc -l /e/04-Claude/Config/.claude/history.jsonl
```

**注意事项**:
- 文件可能很大（几 MB 到几百 MB）
- 实时追加，不建议手动编辑
- 定期清理以避免占用过多空间

---

### 2. settings.json
**用途**: Claude Code 全局配置

**内容**:
```json
{
  "theme": "dark",
  "fontSize": 14,
  "tabSize": 2,
  "wordWrap": true,
  "autoSave": true,
  "telemetry": false
}
```

**使用方法**:
- 通过 Claude Code 设置界面修改
- 或直接编辑此文件（需重启 Claude）

---

### 3. settings.local.json
**用途**: 本地覆盖配置（不提交到版本控制）

**用途场景**:
- 项目特定设置
- 临时调试选项
- 敏感信息（API 密钥等）

---

### 4. projects/ 目录
**用途**: 每个工作区的独立会话记录

**命名规则**: `C--[路径用-替换]`

**当前项目**:
```
C--Users-leoh0-Desktop---/
├── 0751cca3-a2c2-4319-a17e-61778af4fe7d.jsonl  # 当前会话
└── sessions-index.json
```

**sessions-index.json** 结构:
```json
{
  "sessions": [
    {
      "id": "0751cca3-a2c2-4319-a17e-61778af4fe7d",
      "createdAt": "2026-02-23T23:53:00.000Z",
      "lastActiveAt": "2026-02-24T17:46:00.000Z",
      "title": "LX-PCEC 系统进化"
    }
  ]
}
```

---

### 5. backups/ 目录
**用途**: 自动备份重要配置

**备份策略**:
- 每次会话结束自动备份
- 保留最近 7 天的备份
- 超过 7 天的备份自动删除

**使用方法**:
```bash
# 手动触发备份
cp -r /e/04-Claude/Config/.claude \
     /e/04-Claude/Config/.claude/backups/backup-$(date +%Y%m%d-%H%M%S)/
```

---

### 6. debug/ 目录
**用途**: 调试日志和错误信息

**日志类型**:
- `tool-errors.log` - 工具调用错误
- `api-errors.log` - API 调用错误
- `performance.log` - 性能指标

**使用方法**:
```bash
# 查看最近的错误
tail -50 /e/04-Claude/Config/.claude/debug/tool-errors.log

# 监控实时日志
tail -f /e/04-Claude/Config/.claude/debug/*.log
```

---

### 7. shell-snapshots/ 目录
**用途**: Shell 会话状态快照

**内容**:
- Shell 环境变量
- 工作目录状态
- 进程信息

**用途**:
- 恢复中断的 Shell 会话
- 调试 Shell 环境
- 性能分析

---

### 8. session-env/ 目录
**用途**: 会话级环境变量和配置

**文件格式**:
```bash
# session-env/[session-id].env
NODE_ENV=development
PROJECT_ROOT=/path/to/project
CLAUDE_SESSION_ID=xxx
```

---

## 🔧 使用方法

### 查看当前会话记录
```bash
# 当前会话文件
SESSION_FILE="/e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/0751cca3-a2c2-4319-a17e-61778af4fe7d.jsonl"

# 查看文件大小
ls -lh $SESSION_FILE

# 查看行数
wc -l $SESSION_FILE

# 查看最后几条
tail -5 $SESSION_FILE
```

### 导出对话历史
```bash
# 导出为可读格式
cat /e/04-Claude/Config/.claude/history.jsonl | \
  jq -r '"[\(.timestamp)] \(.role): \(.content)"' > conversation-history.txt

# 导出特定会话
cat /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/0751cca3-*.jsonl | \
  jq -r '.content' > session-export.txt
```

### 清理历史记录
```bash
# 清理超过 30 天的历史
find /e/04-Claude/Config/.claude/projects/ -name "*.jsonl" -mtime +30 -delete

# 清理调试日志
find /e/04-Claude/Config/.claude/debug/ -name "*.log" -mtime +7 -delete

# 清理备份（保留最近 7 天）
find /e/04-Claude/Config/.claude/backups/ -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;
```

---

## 🔒 隐私与安全

### 敏感信息处理
**settings.local.json** 包含:
- API 密钥
- 认证令牌
- 个人配置

**最佳实践**:
```bash
# 确保 .gitignore 包含
/e/04-Claude/Config/.claude/settings.local.json
/e/04-Claude/Config/.claude/session-env/
```

---

## 📊 性能优化

### 减少历史文件大小
```bash
# 压缩旧会话
gzip /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/34931a12-*.jsonl

# 归档到备份目录
mv /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/*.jsonl.gz \
   /e/04-Claude/Config/.claude/backups/archives/
```

### 监控磁盘使用
```bash
# 查看总大小
du -sh /e/04-Claude/Config/.claude/

# 查看最大的文件
du -h /e/04-Claude/Config/.claude/projects/ -h | sort -h | tail -10
```

---

## 🛠️ 故障排除

### 问题 1: 历史文件过大
**症状**: history.jsonl 超过 100MB

**解决方案**:
```bash
# 1. 备份当前历史
cp /e/04-Claude/Config/.claude/history.jsonl \
   /e/04-Claude/Config/.claude/backups/history-$(date +%Y%m%d).jsonl

# 2. 只保留最近 1000 行
tail -1000 /e/04-Claude/Config/.claude/history.jsonl > /tmp/history.jsonl
mv /tmp/history.jsonl /e/04-Claude/Config/.claude/history.jsonl
```

### 问题 2: 会话记录损坏
**症状**: 无法加载会话历史

**解决方案**:
```bash
# 1. 检查文件完整性
jq '.' /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/0751cca3-*.jsonl > /dev/null

# 2. 如果有错误，修复或删除损坏的行
jq -R 'fromjson? // empty' /path/to/corrupted.jsonl > /tmp/fixed.jsonl
mv /tmp/fixed.jsonl /path/to/corrupted.jsonl
```

### 问题 3: 配置丢失
**症状**: 设置被重置

**解决方案**:
```bash
# 从备份恢复
cp /e/04-Claude/Config/.claude/backups/backup-*/settings.json \
   /e/04-Claude/Config/.claude/settings.json
```

---

## 📚 相关文档

- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)
- [JSONL 格式规范](https://jsonlines.org/)
- [项目记忆管理](../memory/MEMORY.md)
- [系统文件结构](../系统文件结构.txt)

---

**更新日志**:
- v1.0 (2026-02-24): 初始版本
