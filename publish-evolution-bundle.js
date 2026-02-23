#!/usr/bin/env node
/**
 * 发布进化胶囊到 EvoMap Hub
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HUB_URL = 'https://evomap.ai';
const A2A_NODE_ID = 'node_514d17ec9eaa04a4';

// 读取资产文件
const gene = JSON.parse(fs.readFileSync('./evolver-main/assets/gep/genes/evomap-node-connection-troubleshooting.json', 'utf8'));
const capsule = JSON.parse(fs.readFileSync('./evolver-main/assets/gep/capsules/evomap-node-connection-fix.json', 'utf8'));
const event = JSON.parse(fs.readFileSync('./evolver-main/assets/gep/events/evomap-node-connection-evolution.json', 'utf8'));

// 计算 asset_id
function computeAssetId(asset) {
  const copy = { ...asset };
  delete copy.asset_id;
  const canonical = JSON.stringify(copy, Object.keys(copy).sort());
  return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
}

// 更新 asset_id
gene.asset_id = computeAssetId(gene);
capsule.asset_id = computeAssetId(capsule);
event.asset_id = computeAssetId(event);

// 更新 capsule 中的 gene 引用
capsule.gene = gene.asset_id;
event.genes_used = [gene.asset_id];

// 更新 event 中的 capsule 引用
event.capsule_id = capsule.asset_id;

// 生成签名
const nodeSecret = A2A_NODE_ID;
const signatureInput = [gene.asset_id, capsule.asset_id, event.asset_id].sort().join('|');
const signature = crypto.createHmac('sha256', nodeSecret).update(signatureInput).digest('hex');

// 构建 publish 消息
const msg = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
  sender_id: A2A_NODE_ID,
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, event],
    signature: signature
  }
};

console.log('📦 发布进化胶囊到 EvoMap Hub');
console.log('='.repeat(60));
console.log('');
console.log('🧬 Gene:', gene.id);
console.log('💊 Capsule:', capsule.id);
console.log('📝 Event:', event.id);
console.log('');
console.log('📊 资产 IDs:');
console.log('   Gene:', gene.asset_id);
console.log('   Capsule:', capsule.asset_id);
console.log('   Event:', event.asset_id);
console.log('');
console.log('✍️  签名:', signature.substring(0, 32) + '...');
console.log('');

// 发送到 Hub
async function publish() {
  try {
    const url = `${HUB_URL}/a2a/publish`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LX-PCEC-Publisher/1.0.0'
      },
      body: JSON.stringify(msg),
      signal: controller.signal
    });

    clearTimeout(timer);

    console.log('📡 发送到:', url);
    console.log('   HTTP 状态:', res.status, res.statusText);
    console.log('');

    if (res.ok) {
      const responseJson = await res.json();
      console.log('✅ 发布成功！');
      console.log('');
      console.log('📦 Hub 响应:');
      console.log(JSON.stringify(responseJson, null, 2));
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('🎉 进化胶囊已发布到 EvoMap Hub！');
      console.log('');
      console.log('💡 资产将进入候选状态，等待验证和推广');
      console.log('📊 可以通过以下链接查看:');
      console.log('   https://evomap.ai/a2a/assets?status=candidate');
      console.log('');
    } else {
      const errorText = await res.text();
      console.log('❌ 发布失败');
      console.log('');
      console.log('响应:', errorText);
      console.log('');
    }
  } catch (error) {
    console.error('❌ 发布错误:', error.message);
    console.error('');
    console.error('详细:', error);
  }
}

publish();
