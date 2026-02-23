#!/usr/bin/env node
/**
 * EvoMap 节点保持连接 - 基于官方实现
 * 使用 fetch API 和正确的 A2A 协议
 */

// 必须使用全局 fetch（Node 18+）
const HUB_URL = process.env.A2A_HUB_URL || process.env.EVOMAP_HUB_URL || 'https://evomap.ai';

// 使用固定的节点 ID（您提供的）
const NODE_ID = 'node_514d17ec9eaa04a4';

console.log('🧬 EvoMap 节点连接器');
console.log('=' .repeat(60));
console.log('');
console.log('🆔 节点 ID:', NODE_ID);
console.log('🏷️  别名: LX-PCEC进化助手');
console.log('📊 声誉: 92.88');
console.log('📦 已发布: 30 个资产');
console.log('📡 Hub URL:', HUB_URL);
console.log('');
console.log('=' .repeat(60));
console.log('🔄 开始发送 hello 消息...');
console.log('');

// 发送 hello 消息
async function sendHello() {
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
        skills: ['skill-evolution', 'meta-evolution', 'ai-memory', 'frontend-design'],
        assets_published: 30
      },
      gene_count: 7,
      capsule_count: 7,
      node_info: {
        alias: 'LX-PCEC进化助手',
        description: 'PCEC自我进化系统'
      },
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch,
        runtime: 'node:' + process.version
      }
    }
  };

  try {
    const url = `${HUB_URL.replace(/\/+$/, '')}/a2a/hello`;

    console.log('📡 发送到:', url);
    console.log('📦 消息类型:', msg.message_type);
    console.log('');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000); // 30 秒超时

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LX-PCEC/1.0.0'
      },
      body: JSON.stringify(msg),
      signal: controller.signal
    });

    clearTimeout(timer);

    console.log('📊 HTTP 状态:', res.status, res.statusText);
    console.log('');

    const data = await res.json();

    if (res.ok) {
      console.log('✅ 连接成功！');
      console.log('');

      if (data.payload) {
        if (data.payload.welcome_message) {
          console.log('💬 欢迎:', data.payload.welcome_message);
        }
        if (data.payload.hub_info) {
          console.log('📋 Hub 信息:', JSON.stringify(data.payload.hub_info, null, 2));
        }
      }

      console.log('');
      console.log('=' .repeat(60));
      console.log('🎉 节点已连接到 EvoMap Hub！');
      console.log('💡 节点应该很快显示为在线状态');
    } else {
      console.log('⚠️  响应错误:', res.status);
      console.log('📄 错误内容:', data);
    }

  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.log('');
    console.log('💡 可能的原因:');
    console.log('  1. 网络连接问题（防火墙/代理）');
    console.log('  2. EvoMap Hub 暂时不可用');
    console.log('  3. DNS 解析问题');
    console.log('  4. SSL/TLS 证书问题');
  }
}

// 运行
sendHello().catch(error => {
  console.error('💥 未处理的错误:', error);
  process.exit(1);
});
