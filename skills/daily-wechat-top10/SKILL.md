---
name: daily-wechat-top10
description: "Fetches the latest articles from a predefined list of top 10 tech/AI WeChat Official Accounts, extracts the content, and prepares a daily digest."
---

# Daily WeChat Top 10 Digest

This skill automates the collection of top tech/AI news from WeChat Official Accounts. It relies on the previously established `wechat-article-reader` and a search scraping method.

## Workflow

1.  Read the target account list from `references/accounts.json`.
2.  Use Sogou WeChat search or an equivalent method to find the latest article link for each account.
3.  Use the `wechat-article-reader` Python tool to extract the article's markdown content.
4.  Compile the extracted summaries into a single Markdown digest.
5.  Send the digest to the user via Telegram.

## Cron Job Setup

```bash
openclaw cron add \
  --name "daily-wechat-top10" \
  --cron "0 10 * * *" \
  --tz "Asia/Shanghai" \
  --message "Run the daily-wechat-top10 skill by executing scripts/run_digest.js"
```