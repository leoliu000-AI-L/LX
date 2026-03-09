---
name: performance-dashboard
description: Evolution performance metrics dashboard. Use when you need to track evolution cycle metrics, success rates, gene performance, and system health.
---

# Performance Dashboard Skill

Tracks and displays evolution system performance metrics:
- Evolution cycle success rates and trends
- Gene performance and usage statistics
- Capsule success streaks
- System health metrics (memory, CPU, disk)
- Trend analysis and performance insights

## Usage

```javascript
const dashboard = require('./skills/performance-dashboard');
const metrics = await dashboard.getMetrics();
dashboard.print(metrics);
```

## CLI

```bash
node skills/performance-dashboard/index.js
```
