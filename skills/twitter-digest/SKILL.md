---
name: twitter-digest
description: "Fetches and summarizes Twitter trends and tweets from specified accounts. Use for daily social media briefings and trend analysis."
---

# Twitter Digest

This skill automates the process of fetching, summarizing, and delivering a daily Twitter digest. It combines two main functions:
1.  **Trend Scraping**: Fetches the current top Twitter trends.
2.  **Account Monitoring**: Fetches the latest tweets from a predefined list of accounts.

The skill uses a browser-based automation approach to handle Twitter's dynamic content and anti-scraping measures.

## Core Workflow

1.  **Read Configuration**: Load the list of target accounts from `references/accounts.json`.
2.  **Launch Browser**: Start a browser session. It's recommended to use a profile with a logged-in Twitter/X session to avoid login walls.
3.  **Fetch Trends**: Navigate to the Twitter/X trends page (`https://x.com/explore/tabs/trending`) and use `browser snapshot` to extract the top trend items.
4.  **Fetch Account Tweets**: Iterate through the target accounts:
    -   Navigate to each account's profile page (`https://x.com/<username>`).
    -   Use `browser snapshot` to capture the latest tweets from their timeline.
5.  **Summarize and Format**: Process the raw data from trends and tweets into a clean, readable Markdown report.
6.  **Deliver Report**: Use the `message` tool to send the final report to the specified channel (e.g., Telegram).

## Bundled Resources

### `references/accounts.json`
A simple JSON file containing a list of Twitter usernames to monitor.

```json
{
  "accounts": [
    "lxfater",
    "LufzzLiz",
    "canghe",
    "bourneliu66",
    "Khazix0918",
    "vista8",
    "oran_ge",
    "binghe"
  ]
}
```

### `scripts/run_digest.sh`
A shell script that orchestrates the entire workflow, from launching the browser to sending the final message. This script ensures consistency and reliability. It should be used as the primary entry point for the cron job.

### `scripts/parser.js`
A Node.js script that takes the raw `snapshot` output (as JSON) and parses it to extract trend names, tweet text, authors, and timestamps, producing a structured JSON output for the final report.

## Cron Job Setup

To run this skill automatically, create a cron job that executes the main script.

**Example Cron Command:**
```bash
openclaw cron add \\
  --name "daily-twitter-digest" \\
  --cron "30 9 * * *" \\
  --tz "Asia/Shanghai" \\
  --message "Run the twitter-digest skill by executing scripts/run_digest.sh"
```

## Risk and Mitigation

-   **Twitter Anti-Scraping**: This is the primary risk. The browser-based approach is more resilient than simple `web_fetch`, but can still be blocked.
    -   **Mitigation**: Use a browser profile with a valid, logged-in session. Keep request frequencies low and add randomized delays between page loads.
-   **UI Changes**: Twitter/X frequently updates its UI, which can break the `snapshot` selectors.
    -   **Mitigation**: The `parser.js` script should be designed with fallback selectors and flexible parsing logic to handle minor UI tweaks. If a major change occurs, the script will need to be updated.

By following this structure, the skill provides a robust and maintainable way to generate a daily Twitter digest.
