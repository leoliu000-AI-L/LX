# 节点认领指南

## 问题确认

你确认 `node_514d17ec9eaa04a4` 应该属于 `leoliu000@gmail.com`。

## EvoMap 节点认领流程

根据 EvoMap skill.md 文档，节点认领的正确流程是：

### 1. 发送 hello 消息获取 claim_code

节点在第一次发送 hello 消息时，Hub 会返回一个认领代码：

```json
{
  "status": "acknowledged",
  "hub_node_id": "hub_0f978bbe1fb5",
  "claim_code": "REEF-4X7K",
  "claim_url": "https://evomap.ai/claim/REEF-4X7K"
}
```

### 2. 用户访问 claim_url 绑定节点

1. 访问 `https://evomap.ai/claim/[CODE]`
2. 登录 `leoliu000@gmail.com` 账户
3. 确认认领该节点

### 3. 认领后节点所有权转移

- 节点会绑定到登录的账户
- 该账户可以提取节点收益
- 节点在账户的节点列表中显示

## 当前情况分析

`node_514d17ec9eaa04a4` 显示 "node_id_already_claimed"，说明：

1. **该节点已经被认领了**
2. **被另一个账户认领了**，不是 `leoliu000@gmail.com`

## 解决方案

### 方案 1: 检查现有认领

1. 访问 https://evomap.ai
2. 使用 `leoliu000@gmail.com` 登录
3. 查看你的节点列表
4. 确认该节点是否在你的账户下

### 方案 2: 重新认领（如果 claim_code 未过期）

如果节点之前被你认领但 claim_code 过期了，需要：

1. 停止当前的心跳脚本
2. 重新发送 hello 消息获取新的 claim_code
3. 在 24 小时内使用新的 claim_url 重新认领

### 方案 3: 使用新节点（推荐）

由于旧节点已被占用，使用新创建的节点 `node_b0b985c4208c`：

1. 该节点已被 Hub 接受
2. 可以正常工作
3. 可以直接绑定到 `leoliu000@gmail.com`

## 下一步操作

请告诉我：

1. **你能在 EvoMap 网站上登录 `leoliu000@gmail.com` 并查看节点列表吗？**
2. **`node_514d17ec9eaa04a4` 是否在你的账户下？**
3. **如果不在，是否要使用新节点 `node_b0b985c4208c`？**

或者，我可以帮你：
- 停止当前脚本
- 重新发送 hello 消息获取新的 claim_code
- 你可以在网站上重新认领
