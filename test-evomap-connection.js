#!/usr/bin/env node
/**
 * 测试 EvoMap 节点连接状态
 */

const https = require('https');

const HUB_URL = 'https://evomap.ai';

function getNodeId() {
  const crypto = require('crypto');
  const os = require('os');

  const deviceId = crypto.createHash('sha256')
    .update('evomap:' + os.hostname() + '-' + os.platform() + '-' + os.arch())
    .digest('hex')
    .slice(0, 32);

  const agentName = process.env.AGENT_NAME || 'LX-PCEC';
  const cwd = process.cwd();
  const raw = deviceId + '|' + agentName + '|' + cwd;

  return 'node_' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12);
}

function testConnection() {
  console.log('🧬 测试 EvoMap 节点连接...');
  console.log('');

  const nodeId = getNodeId();
  console.log('🆔 节点 ID:', nodeId);
  console.log('');

  // 构建hello消息
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
        skills: ['skill-evolution', 'meta-evolution', 'ai-memory', 'frontend-design'],
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

  console.log('📡 发送 Hello 消息到 EvoMap Hub...');
  console.log('📍 URL:', HUB_URL);
  console.log('');

  const postData = JSON.stringify(message);

  const options = {
    hostname: 'evomap.ai',
    port: 443,
    path: '/a2a/hello',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'LX-PCEC-Evolver/1.0.0'
    },
    timeout: 15000
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 HTTP 状态:', res.statusCode, res.statusMessage);
      console.log('');

      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ 节点连接成功！');
          console.log('');
          console.log('📦 响应详情:');

          if (response.payload) {
            if (response.payload.welcome_message) {
              console.log('  欢迎消息:', response.payload.welcome_message);
            }
            if (response.payload.hub_info) {
              console.log('  Hub 信息:', response.payload.hub_info);
            }
            if (response.payload.node_status) {
              console.log('  节点状态:', response.payload.node_status);
            }
          }

          console.log('');
          console.log('=' .repeat(60));
          console.log('🎉 节点在线状态正常！');
          console.log('');
          console.log('💡 提示: 节点应该已经显示为在线状态');
        } catch (e) {
          console.log('📄 响应内容:', data);
        }
      } else {
        console.log('❌ 连接失败');
        console.log('错误信息:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ 网络错误:', error.message);
    console.log('');
    console.log('💡 可能的原因:');
    console.log('  1. 网络连接问题');
    console.log('  2. EvoMap Hub 不可用');
    console.log('  3. 防火墙阻止连接');
    console.log('  4. DNS 解析问题');
  });

  req.on('timeout', () => {
    req.destroy();
    console.error('❌ 请求超时');
  });

  req.write(postData);
  req.end();
}

// 运行测试
testConnection();
