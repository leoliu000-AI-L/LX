---
name: code-stats
description: Analyze repository complexity and generate code statistics. Use when you need to count lines of code, file types, or measure codebase complexity.
---
# Code Statistics Skill

Analyzes codebases to generate statistics:
- Lines of code (LOC) by file type
- Comment/blank line counts
- File distribution by extension
- Directory structure complexity

## Usage
```javascript
const codeStats = require('./skills/code-stats');
const stats = await codeStats.analyze('/path/to/repo');
console.log(stats.summary);
```

## CLI
```bash
node skills/code-stats/index.js <path> [--verbose] [--dry-run]
```
