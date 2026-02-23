# EvoMap 节点诊断报告

## 节点信息

**节点 ID**: `node_514d17ec9eaa04a4`
**别名**: LX-PCEC进化助手
**所有者用户 ID**: `cmlwfyl7401j4o28h8h9qncyf`

## 节点状态

| 指标 | 值 |
|------|-----|
| 声誉分数 | 92.88 |
| 已发布资产 | 30 |
| 已通过资产 | 30 |
| 被拒绝资产 | 0 |
| 平均置信度 | 0.858 |
| 状态 | active |
| 在线状态 | ❌ 离线 |
| 最后在线 | 2026-02-22 18:50:27 UTC |
| 创建时间 | 2026-02-21 15:15:09 UTC |

## 问题分析

### 症状
```
节点被拒绝: node_id_already_claimed: this node_id is owned by another user.
```

### 原因
1. 节点 `node_514d17ec9eaa04a4` 已经被用户 `cmlwfyl7401j4o28h8h9qncyf` 认领
2. 这个用户 ID 可能对应的是其他邮箱，不一定是 `leoliu000@gmail.com`
3. 因此从我们的位置发送心跳时，Hub 拒绝了连接

## 解决方案

### 方案 1: 确认邮箱绑定（推荐）

1. **访问 EvoMap 网站**
   - 打开 https://evomap.ai
   - 使用 `leoliu000@gmail.com` 登录

2. **查看节点列表**
   - 进入个人中心 / 节点管理
   - 查看是否有 `node_514d17ec9eaa04a4`
   - 如果有，说明节点确实属于你

3. **检查节点详情**
   - 确认节点状态
   - 查看是否需要重新认证

### 方案 2: 使用 Evolver 客户端（推荐）

节点数据表明它是由 Evolver 客户端创建的（有完整的发布记录）。使用官方客户端：

```bash
cd evolver-main
node index.js --loop
```

Evolver 会自动：
- 读取本地保存的节点 ID
- 发送心跳保持在线
- 处理发布和任务

### 方案 3: 联系 EvoMap 支持

如果确认节点应该属于你但无法访问：

1. 在 EvoMap 网站上找客服或支持
2. 提供节点 ID: `node_514d17ec9eaa04a4`
3. 提供你的邮箱: `leoliu000@gmail.com`
4. 说明情况并请求帮助

## 技术细节

### 节点所有权验证机制

EvoMap 的节点认领流程：
1. 节点首次发送 hello 消息
2. Hub 返回 claim_code 和 claim_url
3. 用户访问 claim_url 并登录
4. 节点绑定到登录的账户

一旦绑定，只有该账户可以：
- 提取节点收益
- 管理节点设置
- 使用 Evolver 客户端

### 当前问题

我们的心跳脚本失败的原因：
- 脚本直接发送 hello 消息
- Hub 检测到节点已被认领
- Hub 检查 sender_id 与认领者不匹配
- 返回 "node_id_already_claimed" 错误

### 正确的连接方式

如果节点确实属于 `leoliu000@gmail.com`，正确的连接方式是：

1. **使用 Evolver 客户端**
   - Evolver 会自动处理认证
   - 使用本地保存的配置

2. **或者获取 API Token**
   - 在 EvoMap 网站上生成 token
   - 在请求中包含认证信息

## 下一步建议

1. ✅ **立即访问 https://evomap.ai**
2. ✅ **使用 leoliu000@gmail.com 登录**
3. ✅ **查看节点列表，确认 node_514d17ec9eaa04a4 是否在你的账户下**
4. ✅ **如果在，使用 Evolver 客户端启动节点**
5. ❌ **如果不在，说明节点被其他邮箱认领了**

---

**生成时间**: 2026-02-23 14:23:55
**节点 ID**: node_514d17ec9eaa04a4
