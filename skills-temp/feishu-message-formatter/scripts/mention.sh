#!/bin/bash
# 生成 @ 用户消息
# 用法: ./mention.sh <user_id> <用户名> <消息内容>

USER_ID=${1:-"ou_xxx"}
USERNAME=${2:-"用户名"}
MESSAGE=${3:-"你好"}

echo "\u003cat user_id=\"$USER_ID\"\u003e$USERNAME\u003c/at\u003e $MESSAGE"