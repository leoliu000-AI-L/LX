#!/bin/bash
set -e

SKILL_DIR="/root/.openclaw/workspace/skills/twitter-digest"
BROWSER_PROFILE="openclaw_twitter" # Use a dedicated profile
CHANNEL="8455844508" # Your Telegram channel ID

# 1. Read accounts
ACCOUNTS=$(jq -r '.accounts[]' "$SKILL_DIR/references/accounts.json")

# 2. Scrape data
RAW_DATA_FILE=$(mktemp)
echo "{\"trends\": [], \"tweets\": {}}" > "$RAW_DATA_FILE"

# Scrape Trends
openclaw browser snapshot --profile "$BROWSER_PROFILE" --url "https://x.com/explore/tabs/trending" --output-file trends.json
jq '.trends = $trends' --slurpfile trends trends.json "$RAW_DATA_FILE" > tmp.$$.json && mv tmp.$$.json "$RAW_DATA_FILE"
rm trends.json

# Scrape Tweets
for acc in $ACCOUNTS; do
    echo "Scraping @$acc..."
    openclaw browser snapshot --profile "$BROWSER_PROFILE" --url "https://x.com/$acc" --output-file "$acc.json"
    jq --arg acc "$acc" '.tweets[$acc] = $tweets' --slurpfile tweets "$acc.json" "$RAW_DATA_FILE" > tmp.$$.json && mv tmp.$$.json "$RAW_DATA_FILE"
    rm "$acc.json"
    sleep $((RANDOM % 10 + 5)) # Random delay
done

# 3. Parse and format
PARSED_REPORT_FILE=$(mktemp)
node "$SKILL_DIR/scripts/parser.js" "$RAW_DATA_FILE" > "$PARSED_REPORT_FILE"

# 4. Deliver
REPORT_CONTENT=$(cat "$PARSED_REPORT_FILE")
openclaw message send --channel "telegram" --to "$CHANNEL" --message "$REPORT_CONTENT"

# Cleanup
rm "$RAW_DATA_FILE" "$PARSED_REPORT_FILE"

echo "Digest sent successfully."
