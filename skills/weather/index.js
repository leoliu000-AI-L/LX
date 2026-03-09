const https = require('https');

async function get(location = '', options = {}) {
  const {
    format = 'text',
    forecast = false,
    dryRun = false
  } = options;

  if (dryRun) {
    return {
      dryRun: true,
      message: `Would fetch weather for ${location || 'current location'} in ${format} format`
    };
  }

  const url = format === 'json' 
    ? `https://wttr.in/${encodeURIComponent(location)}?format=j1`
    : `https://wttr.in/${encodeURIComponent(location)}${forecast ? '' : '?0'}?A`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (format === 'json') {
          try {
            const json = JSON.parse(data);
            resolve({
              json,
              text: formatJsonToText(json)
            });
          } catch (e) {
            reject(new Error('Failed to parse weather data'));
          }
        } else {
          resolve({
            text: data.trim(),
            json: null
          });
        }
      });
    }).on('error', reject);
  });
}

function formatJsonToText(json) {
  const current = json.current_condition[0];
  const location = json.nearest_area[0];
  const forecast = json.weather;

  return [
    `🌤️  Weather for ${location.areaName[0].value}, ${location.country[0].value}`,
    ``,
    `Current: ${current.weatherDesc[0].value}`,
    `🌡️  Temperature: ${current.temp_C}°C (${current.temp_F}°F)`,
    `💧 Humidity: ${current.humidity}%`,
    `🌬️  Wind: ${current.winddir16Point} ${current.windspeedKmph} km/h`,
    `🌧️  Precipitation: ${current.precipMM} mm`,
    ``,
    ...forecast.slice(0, 3).map((day, i) => {
      const date = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      return `${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date}: ${day.maxtempC}°C / ${day.mintempC}°C, ${day.hourly[4].weatherDesc[0].value}`;
    })
  ].join('\n');
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const location = args[0] || '';
  const format = args.includes('--json') ? 'json' : 'text';
  const forecast = args.includes('--forecast');
  const dryRun = args.includes('--dry-run');

  get(location, { format, forecast, dryRun })
    .then(result => {
      if (result.dryRun) {
        console.log(result.message);
      } else if (format === 'json') {
        console.log(JSON.stringify(result.json, null, 2));
      } else {
        console.log(result.text);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error fetching weather:', err.message);
      process.exit(1);
    });
}

module.exports = { get };
