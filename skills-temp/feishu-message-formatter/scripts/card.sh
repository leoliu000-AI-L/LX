#!/bin/bash
# 生成富文本卡片
# 用法: ./card.sh "标题" "内容" "链接"

TITLE=${1:-"通知"}
CONTENT=${2:-"内容"}
LINK=${3:-"https://example.com"}

cat << EOF
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "blue",
    "title": {"content": "$TITLE", "tag": "plain_text"}
  },
  "elements": [
    {"tag": "div", "text": {"tag": "lark_md", "content": "$CONTENT"}},
    {"tag": "hr"},
    {"tag": "div", "text": {"tag": "lark_md", "content": "[查看详情]($LINK)"}}
  ]
}
EOF