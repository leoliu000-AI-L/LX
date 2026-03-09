---
name: weather
description: Get current weather and forecasts via wttr.in or Open-Meteo. Use when: user asks about weather, temperature, or forecasts for any location.
---
# Weather Skill

Fetches weather data from wttr.in:
- Current weather conditions
- 3-day forecast
- Temperature, humidity, wind, precipitation
- Supports any location (city name, ZIP code, coordinates)

## Usage
```javascript
const weather = require('./skills/weather');
const report = await weather.get('Beijing');
console.log(report.text);
```

## CLI
```bash
node skills/weather/index.js <location> [--format text|json] [--forecast]
```
