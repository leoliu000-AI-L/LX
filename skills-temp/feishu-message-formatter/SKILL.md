---
name: feishu-message-formatter
description: 飞书消息格式生成器 - 提供@提及、富文本卡片、Markdown消息等格式的快速生成工具和完整文档
---

# 飞书消息格式生成器

飞书消息格式完整参考和自动化生成工具

---

## 快速开始

```bash
# 生成 @ 用户消息
./scripts/mention.sh ou_xxx "用户名" "消息内容"

# 生成富文本卡片
./scripts/card.sh "标题" "内容" "https://链接.com"

# 生成数据报表卡片
./scripts/report-card.sh "周报" "本周数据..." "+23%"

# 生成通知卡片
./scripts/notice.sh "系统通知" "今晚10点维护"
```

---

## 文本消息 @ 格式

### @ 单个用户
```xml
<at user_id="ou_8b4cb86bf43675df3012c78e256ab669">Sebastian</at>
```

### @ 所有人
```
@_all
```

### @ 群组
```xml
<at user_id="oc_3cc1c4abbc093b180cb0b75e40bb6e1b">群名称</at>
```

---

## 富文本卡片结构

### 基础模板
```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "blue",
    "title": {"content": "标题", "tag": "plain_text"}
  },
  "elements": [...]
}
```

### 模板颜色
- `blue` `wathet` `turquoise` - 蓝系
- `green` `yellow` `orange` `red` - 警示色
- `carmine` `violet` `purple` `indigo` - 紫系
- `grey` - 灰色

---

## 元素标签

| 标签 | 用途 | 示例 |
|------|------|------|
| `div` | 文本区块 | Markdown内容 |
| `img` | 图片 | img_key引用 |
| `hr` | 分割线 | --- |
| `action` | 按钮组 | 交互按钮 |
| `column_set` | 多列布局 | 并排显示 |
| `markdown` | Markdown文本 | **粗体** |
| `plain_text` | 纯文本 | 无格式 |

---

## 完整示例

### 数据报表卡片
```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "green",
    "title": {"content": "📊 周报数据", "tag": "plain_text"}
  },
  "elements": [
    {
      "tag": "column_set",
      "flex_mode": "bisect",
      "columns": [
        {
          "tag": "column",
          "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": "**收入**\n$1.2M"}}
          ]
        },
        {
          "tag": "column",
          "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": "**增长**\n+23% 📈"}}
          ]
        }
      ]
    },
    {"tag": "hr"},
    {"tag": "div", "text": {"tag": "lark_md", "content": "[查看详情](https://example.com)"}}
  ]
}
```

### 通知卡片
```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "orange",
    "title": {"content": "⚠️ 系统通知", "tag": "plain_text"}
  },
  "elements": [
    {"tag": "div", "text": {"tag": "lark_md", "content": "系统将于**今晚10点**进行维护"}},
    {"tag": "hr"},
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "确认收到"},
          "type": "primary",
          "value": {"action": "ack"}
        }
      ]
    }
  ]
}
```

### 带图片的消息
```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "img",
      "img_key": "img_v3_02v5_xxxx",
      "alt": {"tag": "plain_text", "content": "图片描述"}
    },
    {"tag": "div", "text": {"tag": "lark_md", "content": "图片说明文字"}}
  ]
}
```

---

## 发送消息

### 命令行发送
```bash
# 发送文本
message action=send target=chat_id message="@_all 大家好"

# 发送卡片
message action=send target=chat_id content='{"config":...}'
```

### HTTP API
```bash
curl -X POST \
  https://open.feishu.cn/open-apis/im/v1/messages \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "receive_id": "chat_id",
    "msg_type": "interactive",
    "content": "{\"config\":...}"
  }'
```

---

## 参考文档

- [飞书消息格式文档](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/im-v1/message/create_json)
- [卡片搭建工具](https://open.feishu.cn/tool/card_builder)
