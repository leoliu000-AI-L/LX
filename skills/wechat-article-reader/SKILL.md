---
name: wechat-article-reader
description: "Fetches and parses WeChat Official Account articles (mp.weixin.qq.com/s/...) into Markdown, and optionally ingests them into the memory-like-a-tree knowledge base. Use when user wants to archive, read, or summarize a WeChat article link."
---

# WeChat Article Reader Skill

This skill provides a robust pipeline for fetching WeChat Official Account articles and converting them to structured Markdown format. It leverages a Python-based extraction tool (`wechat-article-reader`) and integrates with the `memory-like-a-tree` system for long-term knowledge retention.

## Capabilities

1.  **Single Article Extraction:** Fetch a single `mp.weixin.qq.com/s/...` URL and convert it to a local Markdown file.
2.  **Batch Extraction:** Process a list of URLs and output multiple Markdown files.
3.  **Knowledge Base Ingestion:** Automatically import the extracted Markdown files into the `memory-like-a-tree` system for search and retrieval.

## Core Workflow

### 1. Extracting a Single Article

Use the Python CLI to extract a single article. The output will be a JSON string containing the title, author, publish time, and the full Markdown content.

```bash
cd /root/.openclaw/workspace/wechat-article-reader
source .venv/bin/activate
python scripts/read_wechat_cli.py "https://mp.weixin.qq.com/s/YOUR_ARTICLE_URL" --no-browser
```

### 2. Batch Extraction and Memory Ingestion

To process multiple URLs and ingest them directly into memory, use the provided wrapper script `scripts/ingest.js`.

```bash
node /root/.openclaw/workspace/skills/wechat-article-reader/scripts/ingest.js "url1" "url2" ...
```

## Bundled Resources

### `scripts/ingest.js`

A Node.js script that orchestrates the extraction of one or more WeChat article URLs and automatically appends the parsed content to the `memory-like-a-tree` database (`data/memory.jsonl`). It also handles deduplication based on the generated ID.

### `references/architecture.md`

Contains details on the underlying Python extraction tool, its fallback mechanisms (HTTP vs. Playwright), and how it handles WeChat's anti-scraping measures.

## Dependencies

-   The core extraction logic relies on the Python project located at `/root/.openclaw/workspace/wechat-article-reader`.
-   It requires the Python virtual environment (`.venv`) to be activated before running the Python CLI.
-   Memory ingestion relies on the `memory-like-a-tree` project located at `/root/.openclaw/workspace/memory-like-a-tree`.

## Important Notes

-   **Anti-Scraping:** WeChat implements dynamic anti-scraping measures. The `--no-browser` flag uses a pure HTTP fetch, which is faster but may fail if the page requires JavaScript rendering or encounters a CAPTCHA. If extraction fails repeatedly, the underlying Python tool supports a Playwright-based fallback (if configured).
-   **URL Format:** Only URLs starting with `https://mp.weixin.qq.com/s/` are supported.
