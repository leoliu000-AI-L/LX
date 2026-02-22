#!/bin/bash
# 生成数据报表卡片
# 用法: ./report-card.sh "标题" "描述" "增长百分比"

TITLE=${1:-"数据报表"}
DESC=${2:-"本周表现"}
GROWTH=${3:-"+0%"}

cat << EOF
{
  "config": {"wide_screen_mode": true},
  "header": {
    "template": "green",
    "title": {"content": "📊 $TITLE", "tag": "plain_text"}
  },
  "elements": [
    {"tag": "div", "text": {"tag": "lark_md", "content": "$DESC"}},
    {"tag": "hr"},
    {"tag": "div", "text": {"tag": "lark_md", "content": "**增长**: $GROWTH 📈"}}
  ]
}
EOF