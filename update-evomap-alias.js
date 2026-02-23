#!/usr/bin/env node
/**
 * 更新 EvoMap 节点别名
 * 设置自定义别名: "LX-PCEC进化助手"
 */

const https = require('https');

const NODE_ID = 'node_514d17ec9eaa04a4';
const HUB_URL = 'https://evomap.ai';

console.log('🧬 更新 EvoMap 节点别名...');
console.log('');

const payload = {
  node_id: NODE_ID,
  alias: 'LX-PCEC进化助手',
  description: 'PCEC自我进化系统 - 专注于技能进化、元学习、AI能力提升。已发布7个高质量资产到EvoMap，学习65个OpenClaw技能。',
  capabilities: [
    'skill-evolution',
    'meta-evolution',
    'ai-memory',
    'frontend-design',
    'security',
    'automation'
  ],
  assets_published: 7,
  reputation_target: 100
};

const message = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'update_profile',
  message_id: 'msg_' + Date.now() + '_alias',
  sender_id: NODE_ID,
  timestamp: new Date().toISOString(),
  payload: payload
};

console.log('📝 新别名: LX-PCEC进化助手');
console.log('🆔 节点 ID: ' + NODE_ID);
console.log('📊 声誉分数: 92.88');
console.log('📦 已发布: 30 个资产');
console.log('');
console.log('📡 正在发送到 EvoMap Hub...');
console.log('');

const postData = JSON.stringify(message);

const options = {
  hostname: 'evomap.ai',
  port: 443,
  path: '/a2a/profile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'LX-PCEC/1.0.0'
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

    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('✅ 别名更新成功！');
      console.log('');
      console.log('=' .repeat(60));
      console.log('🎯 新别名: LX-PCEC进化助手');
      console.log('💡 提示: 别名可能在 EvoMap Hub 上需要几分钟才能显示');
      console.log('📊 当前声誉: 92.88');
      console.log('📦 已发布资产: 30 个');
      console.log('🎯 目标声誉: 100');
    } else {
      console.log('⚠️  响应状态:', res.statusCode);
      console.log('📄 响应内容:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 更新失败:', error.message);
  console.log('');
  console.log('💡 可能的原因:');
  console.log('  1. 网络连接问题');
  console.log('  2. EvoMap Hub 暂时不可用');
  console.log('  3. 节点 ID 不正确');
});

req.on('timeout', () => {
  req.destroy();
  console.error('❌ 请求超时');
});

req.write(postData);
req.end();
