#!/usr/bin/env node
/**
 * EvoMap 节点心跳保持器
 * 持续发送 hello 消息保持节点在线
 */

const https = require('https');
const crypto = require('crypto');
const os = require('os');

const HUB_URL = 'https://evomap.ai';
const HEARTBEAT_INTERVAL = 60000; // 每 60 秒发送一次心跳

function getNodeId() {
  const deviceId = crypto.createHash('sha256')
    .update('evomap:' + os.hostname() + '-' + os.platform() + '-' + os.arch())
    .digest('hex')
    .slice(0, 32);

  const agentName = process.env.AGENT_NAME || 'LX-PCEC';
  const cwd = process.cwd();
  const raw = deviceId + '|' + agentName + '|' + cwd;

  return 'node_' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12);
}

function sendHello() {
  const nodeId = getNodeId();

  const message = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'hello',
    message_id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    sender_id: nodeId,
    timestamp: new Date().toISOString(),
    payload: {
      capabilities: {
        evolution: true,
        skills: ['skill-evolution', 'meta-evolution', 'ai-memory', 'frontend-design', 'security'],
        assets_published: 7
      },
      gene_count: 7,
      capsule_count: 7,
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch,
        runtime: 'node:' + process.version
      }
    }
  };

  const postData = JSON.stringify(message);

  const options = {
    hostname: 'evomap.ai',
    port: 443,
    path: '/a2a/hello',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'LX-PCEC-Heartbeat/1.0.0'
    },
    timeout: 15000
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[${new Date().toLocaleTimeString()}] ✅ 心跳成功 - 节点 ${nodeId} 在线`);
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          console.log(`[${new Date().toLocaleTimeString()}] ⚠️  心跳响应: ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ 心跳失败:`, error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`[${new Date().toLocaleTimeString()}] ❌ 心跳超时`);
      reject(new Error('timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function startHeartbeat() {
  console.log('🧬 EvoMap 节点心跳保持器');
  console.log('=' .repeat(60));
  console.log('');

  const nodeId = getNodeId();
  console.log('🆔 节点 ID:', nodeId);
  console.log('📡 Hub URL:', HUB_URL);
  console.log('⏱️  心跳间隔:', HEARTBEAT_INTERVAL / 1000, '秒');
  console.log('');
  console.log('=' .repeat(60));
  console.log('');

  // 立即发送第一次心跳
  try {
    await sendHello();
    console.log('');
    console.log('💡 节点应该已显示为在线状态');
    console.log('🔄 心跳保持器将持续运行...');
    console.log('');
  } catch (error) {
    console.error('⚠️  首次心跳失败，但将继续尝试');
  }

  // 定时发送心跳
  setInterval(async () => {
    try {
      await sendHello();
    } catch (error) {
      // 错误已在 sendHello 中处理
    }
  }, HEARTBEAT_INTERVAL);
}

// 启动心跳保持器
startHeartbeat().catch(error => {
  console.error('💥 启动失败:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 正在停止心跳保持器...');
  console.log('💡 节点将显示为离线状态');
  process.exit(0);
});
