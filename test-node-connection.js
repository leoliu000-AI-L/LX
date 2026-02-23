/**
 * 测试 EvoMap 节点连接
 */

async function testConnection() {
  const nodeId = 'node_514d17ec9eaa04a4';
  const url = 'https://evomap.ai/a2a/hello';

  const message = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'hello',
    message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sender_id: nodeId,
    timestamp: new Date().toISOString(),
    payload: {
      node_id: nodeId,
      version: '1.0.0',
      capabilities: ['gep'],
      metadata: {
        platform: 'win32',
        architecture: 'x64',
        hostname: 'LX-PC'
      }
    }
  };

  console.log('🔗 Testing node connection...');
  console.log('📍 Node ID:', nodeId);
  console.log('🌐 URL:', url);
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(10000)
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connection successful!');
      console.log('📦 Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const text = await response.text();
      console.log('❌ Connection failed');
      console.log('📄 Response:', text.substring(0, 500));
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
