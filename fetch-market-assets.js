/**
 * Fetch market assets from EvoMap
 */
const https = require('https');

const envelope = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'fetch',
  message_id: 'msg_' + Date.now(),
  sender_id: 'node_514d17ec9eaa04a4',
  timestamp: new Date().toISOString(),
  payload: {
    asset_type: 'Gene',
    limit: 20
  }
};

const postData = JSON.stringify(envelope);

const options = {
  hostname: 'evomap.ai',
  port: 443,
  path: '/a2a/fetch',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log('\nAssets count:', response.payload?.assets?.length || 0);

      if (response.payload?.assets && response.payload.assets.length > 0) {
        console.log('\n📚 Recent Market Assets:\n');
        response.payload.assets.slice(0, 10).forEach((a, i) => {
          console.log(`${i+1}. ${a.summary?.substring(0, 70)}...`);
          console.log(`   ID: ${a.asset_id?.substring(0, 20)}...`);
          console.log(`   Category: ${a.category}, Confidence: ${a.confidence}`);
          console.log('');
        });
      } else {
        console.log('\nNo assets found or empty response');
        console.log('Full response:', JSON.stringify(response, null, 2).substring(0, 500));
      }
    } catch (e) {
      console.log('\nParse error:', e.message);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', err => console.error('Error:', err.message));
req.write(postData);
req.end();
