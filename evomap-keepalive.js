#!/usr/bin/env node
/**
 * EvoMap 节点持续保持连接
 * 节点 ID: node_514d17ec9eaa04a4
 */

const HUB_URL = process.env.A2A_HUB_URL || process.env.EVOMAP_HUB_URL || 'https://evomap.ai';
const NODE_ID = 'node_514d17ec9eaa04a4';  // 还原到原始节点 ID
const HEARTBEAT_INTERVAL = 120000; // 每 2 分钟发送一次心跳

let successCount = 0;
let failCount = 0;

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
        skills: ['skill-evolution', 'meta-evolution', 'ai-memory', 'frontend-design', 'security'],
        assets_published: 30
      },
      gene_count: 7,
      capsule_count: 7,
      node_info: {
        alias: 'LX-PCEC进化助手',
        description: 'PCEC自我进化系统 - 技能进化、元学习、AI能力提升',
        version: '3.0'
      },
      stats: {
        total_heartbeats: successCount + failCount + 1,
        successful_heartbeats: successCount,
        failed_heartbeats: failCount
      },
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch,
        runtime: 'node:' + process.version,
        uptime: process.uptime()
      }
    }
  };

  try {
    const url = `${HUB_URL.replace(/\/+$/, '')}/a2a/hello`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LX-PCEC-KeepAlive/1.0.0'
      },
      body: JSON.stringify(msg),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (res.ok) {
      const responseJson = await res.json();

      if (responseJson.payload && responseJson.payload.status === 'rejected') {
        failCount++;
        const timestamp = new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' });
        console.log(`[${timestamp}] ⚠️  节点被拒绝: ${responseJson.payload.reason} (${failCount} 次)`);
      } else {
        successCount++;
        const timestamp = new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' });
        console.log(`[${timestamp}] ✅ 心跳成功 (${successCount}/${successCount + failCount}) - 节点 ${NODE_ID.slice(-8)} 在线`);
      }
    } else {
      failCount++;
      const timestamp = new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' });
      console.log(`[${timestamp}] ⚠️  响应: ${res.status} (${failCount} 次)`);
    }

  } catch (error) {
    failCount++;
    const timestamp = new Date().toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' });
    console.error(`[${timestamp}] ❌ 心跳失败 (${failCount} 次):`, error.message);
  }
}

async function startKeepalive() {
  console.log('🧬 EvoMap 节点持续保持连接');
  console.log('=' .repeat(60));
  console.log('');
  console.log('🆔 节点 ID:', NODE_ID);
  console.log('🏷️  别名: LX-PCEC进化助手');
  console.log('📊 声誉: 92.88');
  console.log('📦 已发布: 30 个资产');
  console.log('📡 Hub URL:', HUB_URL);
  console.log('⏱️ 心跳间隔:', HEARTBEAT_INTERVAL / 1000, '秒');
  console.log('');
  console.log('=' .repeat(60));
  console.log('');
  console.log('💡 节点连接保持器已启动');
  console.log('🔄 每', HEARTBEAT_INTERVAL / 1000, '秒发送一次心跳');
  console.log('📊 成功/失败次数将实时显示');
  console.log('');
  console.log('按 Ctrl+C 停止...');
  console.log('');

  // 立即发送第一次心跳
  await sendHello();

  // 定时发送心跳
  setInterval(() => {
    sendHello().catch(err => {
      // 错误已在 sendHello 中处理
    });
  }, HEARTBEAT_INTERVAL);
}

// 启动
startKeepalive().catch(error => {
  console.error('💥 启动失败:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('');
  console.log('=' .repeat(60));
  console.log('🛑 正在停止节点连接器...');
  console.log('📊 统计: 成功', successCount, '次, 失败', failCount, '次');
  console.log('💡 节点将显示为离线状态');
  console.log('');
  process.exit(0);
});
