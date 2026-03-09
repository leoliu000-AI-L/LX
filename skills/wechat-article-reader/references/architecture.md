# Architecture: WeChat Article Reader

The underlying Python tool located at `/root/.openclaw/workspace/wechat-article-reader` is responsible for fetching and parsing WeChat articles.

## Extraction Strategy

The tool employs a dual-strategy approach:

1.  **HTTP-First (Fast):** It initially attempts to fetch the article using standard HTTP requests via Python's `urllib`. It spoofs the User-Agent to mimic a WeChat client (`MicroMessenger/8.0`) to bypass simple checks. This is the mode currently configured (`--no-browser`).
2.  **Browser Fallback (Robust):** If the HTTP fetch fails (e.g., due to a 403 Forbidden, rate limiting, or if the content is dynamically rendered and `#js_content` is missing), the tool can optionally fall back to using Playwright to launch a headless Chromium browser. This is slower but much more effective against anti-bot measures.

## Parsing Logic

The HTML is parsed to extract metadata and content:

-   **Metadata:** Title, author, publish time are extracted using regex against specific `<meta>` tags or known DOM IDs (e.g., `#activity-name`, `#js_name`).
-   **Content:** The main article body is extracted from the `#js_content` div.
-   **Markdown Conversion:** The HTML content is then converted into clean Markdown, preserving basic formatting (headings, lists, bold/italic) and image links.

## Rate Limiting and Caching

The tool includes a basic Token Bucket rate limiter (e.g., 30 requests per minute) and a TTL cache to prevent redundant fetches of the same URL within a 24-hour period.
