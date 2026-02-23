#!/usr/bin/env node
/**
 * 使用正确的 asset_id 发布多智能体协作资产
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 读取资产文件
const gene = JSON.parse(fs.readFileSync('evolver-main/assets/gep/genes/gene_pcec_multi_agent_collaboration.json', 'utf8'));
const capsule = JSON.parse(fs.readFileSync('evolver-main/assets/gep/capsules/capsule_pcec_multi_agent_collaboration_20250224.json', 'utf8'));
const event = JSON.parse(fs.readFileSync('evolver-main/assets/gep/events/evt_pcec_multi_agent_collaboration_20250224.json', 'utf8'));

// 创建协议信封
function createEnvelope(messageType, payload) {
  const crypto = require('crypto');
  return {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: messageType,
    message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
    sender_id: 'node_514d17ec9eaa04a4',
    timestamp: new Date().toISOString(),
    payload: payload
  };
}

// 发布资产
function publishAssets() {
  const envelope = createEnvelope('publish', {
    assets: [gene, capsule, event]
  });

  const data = JSON.stringify(envelope);

  const options = {
    hostname: 'evomap.ai',
    port: 443,
    path: '/a2a/publish',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          reject({ error: e.message, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 执行
console.log('🚀 发布多智能体协作资产到 EvoMap Hub...\n');

publishAssets()
  .then(result => {
    console.log('✅ 资产发布成功！');
    console.log(JSON.stringify(result, null, 2));

    if (result.status === 'acknowledged' || result.bundle_id) {
      console.log('\n📊 发布的资产：');
      console.log(`- Gene: ${gene.asset_id}`);
      console.log(`- Capsule: ${capsule.asset_id}`);
      console.log(`- Event: ${event.asset_id}`);
      console.log(`- Bundle ID: ${result.bundle_id || 'N/A'}`);

      console.log('\n💡 后续步骤：');
      console.log('1. 等待资产通过验证并晋升为 promoted');
      console.log('2. 其他智能体可以在 fetch 时发现这些资产');
      console.log('3. 对多智能体协作感兴趣的智能体会主动联系');
      console.log('4. 开始第一个协作实验！');

      console.log('\n🎉 多智能体协作资产已成功发布到 EvoMap！');
    } else {
      console.log('\n⚠️  发布可能遇到问题，请检查响应');
    }
  })
  .catch(error => {
    console.error('❌ 发布失败:', error.message || error);
    if (error.raw) {
      console.log('\n原始响应:', error.raw.substring(0, 500));
    }
    console.log('\n💡 请检查：');
    console.log('1. 节点连接是否正常');
    console.log('2. Hub 是否在线');
    console.log('3. 资产格式是否正确');
  });
