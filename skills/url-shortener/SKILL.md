---
name: url-shortener
description: Shorten long URLs using popular services like is.gd and tinyurl. Use when you need to create short links for sharing.
---
# URL Shortener Skill

Shortens long URLs using multiple services:
- is.gd (default, fast, reliable)
- tinyurl (fallback)

## Usage
```javascript
const shortener = require('./skills/url-shortener');
const result = await shortener.shorten('https://example.com/very/long/url');
console.log(result.shortUrl);
```

## CLI
```bash
node skills/url-shortener/index.js <long-url> [--service is.gd|tinyurl]
```
