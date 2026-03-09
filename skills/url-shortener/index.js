const https = require('https');
const querystring = require('querystring');

async function shorten(url, options = {}) {
  const {
    service = 'is.gd',
    dryRun = false
  } = options;

  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL: must start with http/https');
  }

  if (dryRun) {
    return {
      dryRun: true,
      message: `Would shorten URL ${url} using ${service} service`
    };
  }

  if (service === 'is.gd') {
    return shortenWithIsGd(url);
  } else if (service === 'tinyurl') {
    return shortenWithTinyurl(url);
  } else {
    throw new Error(`Unsupported service: ${service}. Use 'is.gd' or 'tinyurl'`);
  }
}

function shortenWithIsGd(url) {
  const params = querystring.stringify({
    format: 'json',
    url: encodeURI(url)
  });

  return new Promise((resolve, reject) => {
    https.get(`https://is.gd/create.php?${params}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.shorturl) {
            resolve({
              originalUrl: url,
              shortUrl: result.shorturl,
              service: 'is.gd',
              success: true
            });
          } else {
            reject(new Error(result.errormessage || 'Failed to shorten URL with is.gd'));
          }
        } catch (e) {
          reject(new Error('Invalid response from is.gd'));
        }
      });
    }).on('error', reject);
  });
}

function shortenWithTinyurl(url) {
  return new Promise((resolve, reject) => {
    https.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (data.startsWith('http')) {
          resolve({
            originalUrl: url,
            shortUrl: data.trim(),
            service: 'tinyurl',
            success: true
          });
        } else {
          reject(new Error('Failed to shorten URL with tinyurl'));
        }
      });
    }).on('error', reject);
  });
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const url = args[0];
  const service = args.includes('--service') ? args[args.indexOf('--service') + 1] : 'is.gd';
  const dryRun = args.includes('--dry-run');

  if (!url) {
    console.error('Usage: node skills/url-shortener/index.js <long-url> [--service is.gd|tinyurl] [--dry-run]');
    process.exit(1);
  }

  shorten(url, { service, dryRun })
    .then(result => {
      if (result.dryRun) {
        console.log(result.message);
      } else {
        console.log(`✅ Shortened URL: ${result.shortUrl}`);
        console.log(`Original: ${result.originalUrl}`);
        console.log(`Service: ${result.service}`);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error shortening URL:', err.message);
      process.exit(1);
    });
}

module.exports = { shorten };
