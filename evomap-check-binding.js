#!/usr/bin/env node
/**
 * 创建新的 EvoMap 节点，绑定到 leoliu000@gmail.com
 */

const crypto = require('crypto');
const HUB_URL = process.env.A2A_HUB_URL || process.env.EVOMAP_HUB_URL || 'https://evomap.ai';

// 生成唯一的节点 ID
const hostname = require('os').hostname();
const platform = process.platform;
const arch = process.arch;
const uniqueSuffix = crypto.randomBytes(4).toString('hex');
const NODE_ID = `node_${crypto.createHash('sha256').update(hostname + platform + arch + uniqueSuffix).digest('hex').slice(0, 12)}`;
const OWNER_EMAIL = 'leoliu000@gmail.com';

async function createNewNode() {
  console.log('🆕 创建新的 EvoMap 节点');
  console.log('='.repeat(60));
  console.log('');
  console.log('🆔 新节点 ID:', NODE_ID);
  console.log('📧 绑定邮箱:', OWNER_EMAIL);
  console.log('🖥️  主机名:', hostname);
  console.log('📊 平台:', platform + '/' + arch);
  console.log('📡 Hub URL:', HUB_URL);
  console.log('');

  const msg = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'hello',
    message_id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    sender_id: NODE_ID,
    timestamp: new Date().toISOString(),
    payload: {
      capabilities: {
        evolution: true,
        skills: ['skill-evolution', 'meta-evolution', 'ai-memory', 'frontend-design', 'security'],
        assets_published: 0  // 新节点从 0 开始
      },
      gene_count: 0,
      capsule_count: 0,
      node_info: {
        alias: 'LX-PCEC进化助手 v2',
        description: 'PCEC自我进化系统 - 新节点',
        version: '3.0'
      },
      owner_email: OWNER_EMAIL,
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch,
        runtime: 'node:' + process.version,
        hostname: hostname
      }
    }
  };

  try {
    const url = `${HUB_URL.replace(/\/+$/, '')}/a2a/hello`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LX-PCEC-NodeCreator/1.0.0'
      },
      body: JSON.stringify(msg),
      signal: controller.signal
    });

    clearTimeout(timer);

    console.log('📡 注册节点到 EvoMap Hub...');
    console.log('   HTTP 状态:', res.status, res.statusText);

    if (res.ok) {
      const responseJson = await res.json();
      console.log('');
      console.log('✅ 节点创建成功！');
      console.log('');
      console.log('📦 Hub 响应:');
      console.log('   协议:', responseJson.protocol);
      console.log('   消息类型:', responseJson.message_type);
      console.log('   Hub ID:', responseJson.sender_id);

      if (responseJson.payload) {
        console.log('   状态:', responseJson.payload.status);
        if (responseJson.payload.status === 'rejected') {
          console.log('   原因:', responseJson.payload.reason);
        } else {
          console.log('   ✅ 节点已被接受');
        }
      }
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('🎉 下一步操作:');
      console.log('');
      console.log('1. 保存新节点 ID:', NODE_ID);
      console.log('2. 更新环境变量:');
      console.log('   export A2A_NODE_ID=' + NODE_ID);
      console.log('');
      console.log('3. 启动 Evolver (使用新节点 ID):');
      console.log('   node evolver-main/index.js --loop');
      console.log('');
      console.log('4. 或者运行新的心跳保持器:');
      console.log('   node evomap-keepalive-v2.js');
      console.log('');
    } else {
      console.log('❌ 注册失败');
      console.log('响应:', await res.text());
    }

  } catch (error) {
    console.error('❌ 连接错误:', error.message);
  }
}

createNewNode().catch(error => {
  console.error('💥 创建失败:', error);
  process.exit(1);
});
