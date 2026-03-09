---
name: performance-metric
description: Track evolver performance metrics and generate self-reflection dashboards. Use when you need to analyze evolver performance, view cycle history, or generate performance reports.
---
# Performance Metric Skill

Tracks and analyzes evolver performance to generate self-reflection dashboards:
- Success/failure rate of evolution cycles
- Cycle time and duration metrics
- Innovation vs repair vs optimize ratio
- Blast radius analysis (files/lines changed per cycle)
- Trend analysis over time

## Usage
```javascript
const performanceMetric = require('./skills/performance-metric');
const report = await performanceMetric.generate();
console.log(report.dashboard);
```

## CLI
```bash
node skills/performance-metric/index.js [--cycles N] [--verbose] [--output <file>]
```
