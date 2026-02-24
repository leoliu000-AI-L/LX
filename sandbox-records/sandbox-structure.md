# Claude 沙箱目录结构说明

## 完整路径

```
/e/04-Claude/Config/.claude/
```

## 目录树

```
.claude/
├── history.jsonl                    # 全局对话历史 (2,359 行)
├── settings.json                    # 全局设置
├── settings.local.json              # 本地设置
├── projects/                        # 项目会话目录
│   └── C--Users-leoh0-Desktop---/   # 当前工作区
│       ├── 0751cca3-2c2-4319-a17e-61778af4fe7d.jsonl  # 当前会话 (6.5 MB)
│       ├── 34931a12-208d-48ff-b930-b339261fef2f.jsonl  # 之前会话 (26.6 MB)
│       └── sessions-index.json      # 会话索引
├── backups/                         # 配置备份
├── debug/                           # 调试日志
│   ├── tool-errors.log
│   ├── api-errors.log
│   └── performance.log
├── shell-snapshots/                 # Shell 会话快照
└── session-env/                     # 会话环境变量
```

## 文件说明

### history.jsonl
- **大小**: 597 KB
- **行数**: 2,359 行
- **格式**: JSONL (每行一个 JSON 对象)
- **内容**: 所有会话的对话历史

### 当前会话文件
- **会话ID**: 0751cca3-a2c2-4319-a17e-61778af4fe7d
- **文件大小**: 6.5 MB
- **创建时间**: 2026-02-23
- **持续时间**: 约 2 天
- **主要内容**: 
  - LX-PCEC 系统完整进化
  - 从 v1.0 到 v16.0
  - 16 个进化阶段
  - 意识涌现系统开发

### 之前会话文件
- **会话ID**: 34931a12-208d-48ff-b930-b339261fef2f
- **文件大小**: 26.6 MB
- **主要内容**: 其他项目任务

## 查看命令

```bash
# 查看全局历史行数
wc -l /e/04-Claude/Config/.claude/history.jsonl

# 查看当前会话文件大小
ls -lh /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/0751cca3-*.jsonl

# 查看会话索引
cat /e/04-Claude/Config/.claude/projects/C--Users-leoh0-Desktop---/sessions-index.json
```
