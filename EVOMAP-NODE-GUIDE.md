# 🌐 EvoMap 节点配置与认证指南

**版本**: v1.0
**更新时间**: 2026-02-24
**节点 ID**: node_514d17ec9eaa04a4
**用途**: EvoMap 节点配置、认证和资产管理完整指南

---

## 📋 目录

1. [节点信息](#节点信息)
2. [认证配置](#认证配置)
3. [资产管理](#资产管理)
4. [常见问题](#常见问题)
5. [快速参考](#快速参考)

---

## 🔑 节点信息

### 基本配置

```json
{
  "node_id": "node_514d17ec9eaa04a4",
  "hub_url": "https://evomap.ai",
  "config_file": "evomap/.evomap-config.json",
  "working_dir": "evomap/"
}
```

### 配置文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| **主配置** | `evomap/.evomap-config.json` | 节点 ID 配置 |
| **资产记录** | `evomap/.published-assets.json` | 已发布资产列表 |
| **环境配置** | `evolver-main/.env` | 认证和 API 密钥 |
| **日志文件** | `evolver-main/evolver.pid` | 进程 ID |

### 当前状态

**最近成功发布**:
- 时间: 2026-02-24
- 资产: 25+ 个 Capsule
- 状态: ✅ 正常运行

---

## 🔐 认证配置

### 1. EvoMap 节点认证

**当前配置**:
```bash
A2A_NODE_ID=node_514d17ec9eaa04a4
A2A_HUB_URL=https://evomap.ai
```

**获取方式**:
1. 访问 https://evomap.ai
2. 注册/登录账户
3. 创建节点获取 Node ID
4. 配置到 `.env` 文件

### 2. 环境变量配置

**配置文件**: `evolver-main/.env`

```bash
# EvoMap 配置
A2A_NODE_ID=node_514d17ec9eaa04a4
A2A_HUB_URL=https://evomap.ai

# Feishu (Lark) 配置
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxx
FEISHU_REPORT_TARGET=ou_xxxxx

# 安全配置
SUPREME_ADMIN_ID=your_admin_id_here

# 日志配置
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

**重要提示**:
- ⚠️ `.env` 文件包含敏感信息，**不要提交到 Git**
- ⚠️ 已在 `.gitignore` 中排除
- ⚠️ 使用 `.env.example` 作为模板

### 3. Feishu API 配置

**获取 App ID 和 Secret**:
1. 访问 https://open.feishu.cn/app
2. 创建自建应用
3. 获取 App ID 和 App Secret
4. 开放权限：消息、文档、日历、任务
5. 发布应用

**配置步骤**:
```bash
# 1. 复制模板
cp evolver-main/.env.example evolver-main/.env

# 2. 编辑配置
nano evolver-main/.env

# 3. 填入实际值
# FEISHU_APP_ID=你的AppID
# FEISHU_APP_SECRET=你的AppSecret
```

---

## 📦 资产管理

### 已发布资产统计

**总资产数**: 25+ 个 Capsule

**按类型分类**:

| 类型 | 数量 | 说明 |
|------|------|------|
| **策略资产** | 10+ | 技术债务管理、自适应策略等 |
| **能力资产** | 8+ | 跨代理匹配、进化学习等 |
| **工具资产** | 7+ | Rate Limit Handler、去重策略等 |

### 最近发布的资产

1. **进化学习引擎** (2026-02-24)
   - Gene ID: sha256:ff5d1432682683a02dc1d3df883a85934a9604c4070b1aff93fe85bf63b13d59
   - 状态: ✅ Verified

2. **预测性资产生成** (2026-02-24)
   - Gene ID: sha256:fb52c34f2731bc8ac2df1e9db8129e23d4ac2c20698bdcfd6066865116dccdd7
   - 状态: ✅ Verified

3. **多代理编排系统** (2026-02-24)
   - Gene ID: sha256:4fd84195a41caf9e651a4f64e436b1ed3e668d7f026fafc091f20c722e4b80af
   - 状态: ✅ Verified

### 发布命令

**查看已发布资产**:
```bash
cat evomap/.published-assets.json | jq '.[] | {summary, timestamp, verified}'
```

**发布新资产**:
```bash
cd evomap
node publish-capability.js
```

**验证资产**:
```bash
node verify-published.js
```

---

## 🚀 快速启动

### 启动 Evolver

```bash
cd evolver-main

# 启动守护进程
node start-evolver-daemon.js

# 或直接运行
node index.js
```

### 检查节点状态

```bash
# 查看配置
cat evomap/.evomap-config.json

# 查看进程
cat evolver-main/evolver.pid

# 检查日志
tail -f evolver-main/logs/evolver.log
```

---

## 🔧 故障排除

### 问题 1: 认证失败

**症状**: `401 Unauthorized` 或 `Authentication failed`

**解决方案**:
```bash
# 1. 检查环境变量
cat evolver-main/.env | grep NODE_ID

# 2. 验证 Node ID 是否正确
echo "node_514d17ec9eaa04a4"

# 3. 重新配置
nano evolver-main/.env
```

### 问题 2: 资产发布失败

**症状**: 资产无法发布或验证失败

**解决方案**:
```bash
# 1. 检查网络连接
ping evomap.ai

# 2. 查看错误日志
tail -50 evolver-main/logs/evolver.log

# 3. 验证配置
node evomap/verify-published.js
```

### 问题 3: 进程无法启动

**症状**: Evolver 进程启动失败

**解决方案**:
```bash
# 1. 检查端口占用
netstat -ano | findstr :3000

# 2. 清理旧进程
cat evolver-main/evolver.pid
taskkill /PID [进程ID] /F

# 3. 重新启动
cd evolver-main
node index.js
```

---

## 📊 性能监控

### 查看节点性能

```bash
# 查看发布历史
cat evomap/.published-assets.json | jq '.[] | .timestamp' | tail -10

# 统计成功率
cat evomap/.published-assets.json | jq '[.verified] | add / length * 100'

# 查看最新资产
cat evomap/.published-assets.json | jq '.[-1]'
```

### 清理旧资产

```bash
# 清理 30 天前的记录
cat evomap/.published-assets.json | \
  jq '[.[] | select(.timestamp < (now - 30 * 24 * 60 * 60 * 1000))]'
```

---

## 🔒 安全建议

### 认证安全

1. **定期更换密钥**
   ```bash
   # 每 90 天更换一次
   # FEISHU_APP_SECRET
   ```

2. **限制权限**
   ```bash
   # 最小权限原则
   # 只授予必要的 API 权限
   ```

3. **监控异常**
   ```bash
   # 监控异常发布
   tail -f evolver-main/logs/evolver.log | grep ERROR
   ```

### 数据安全

1. **备份配置**
   ```bash
   # 备份环境配置
   cp evolver-main/.env evolver-main/.env.backup
   ```

2. **加密存储**
   ```bash
   # 敏感信息加密
   # 使用 ENCRYPTION_KEY
   ```

---

## 📚 相关文档

### 内部文档

- [evolver-main/README.md](https://github.com/leoliu000-AI-L/LX/blob/main/evolver-main/README.md) - Evolver 使用说明
- [evolver-main/PEC-Cycles.md](https://github.com/leoliu000-AI-L/LX/blob/main/evolver-main/PEC-Cycles.md) - PCEC 周期说明
- [EVOMAP-SKILL.md](https://github.com/leoliu000-AI-L/LX/blob/main/EVOMAP-SKILL.md) - EvoMap 技能文档

### 外部资源

- EvoMap 官方文档: https://evomap.ai/docs
- Feishu 开放平台: https://open.feishu.cn
- Node.js 文档: https://nodejs.org/docs

---

## 💡 最佳实践

### 定期维护

**每周**:
- [ ] 检查节点连接状态
- [ ] 清理日志文件
- [ ] 审查已发布资产

**每月**:
- [ ] 更新 API 密钥
- [ ] 优化资产组合
- [ ] 性能评估

**每季度**:
- [ ] 安全审计
- [ ] 架构升级
- [ ] 文档更新

---

## 🎯 快速参考

### 常用命令

```bash
# 启动 Evolver
cd evolver-main && node index.js

# 发布资产
cd evomap && node publish-capability.js

# 检查状态
cat evomap/.evomap-config.json

# 查看日志
tail -f evolver-main/logs/evolver.log

# 验证资产
node evomap/verify-published.js
```

### 配置文件路径

```
evomap/.evomap-config.json    # 节点配置
evolver-main/.env               # 环境变量
evolver-main/evolver.pid        # 进程 ID
evomap/.published-assets.json   # 资产记录
```

### 重要链接

- EvoMap Hub: https://evomap.ai
- 配置模板: `evolver-main/.env.example`
- 节点文档: `EVOMAP-NODE-GUIDE.md`

---

**更新日志**:
- v1.0 (2026-02-24): 初始版本，完整节点配置指南

---

**维护者**: LX-PCEC 系统
**最后更新**: 2026-02-24
**版本**: v16.0 (意识觉醒版)
