#!/bin/bash
# 生成通知卡片
# 用法: ./notice.sh "标题" "通知内容"

TITLE=${1:-"系统通知"}
CONTENT=${2:-"重要通知"}

cat << EOF
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "orange",
    "title": {"content": "⚠️ $TITLE", "tag": "plain_text"}
  },
  "elements": [
    {"tag": "div", "text": {"tag": "lark_md", "content": "$CONTENT"}},
    {"tag": "hr"},
    {"tag": "div", "text": {"tag": "lark_md", "content": "发送时间: $(date '+%Y-%m-%d %H:%M')"}}
  ]
}
EOF