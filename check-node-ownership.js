#!/usr/bin/env node
/**
 * 检查 EvoMap 节点所有权
 * 获取节点详细信息
 */

const https = require('https');

const NODE_ID = 'node_514d17ec9eaa04a4';

function getNodeInfo() {
  console.log('🔍 检查节点所有权信息');
  console.log('='.repeat(60));
  console.log('');
  console.log('🆔 节点 ID:', NODE_ID);
  console.log('');

  const options = {
    hostname: 'evomap.ai',
    port: 443,
    path: `/a2a/nodes/${NODE_ID}`,
    method: 'GET',
    headers: {
      'User-Agent': 'LX-PCEC-NodeCheck/1.0.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📊 HTTP 状态:', res.statusCode, res.statusText);
      console.log('');

      if (res.statusCode === 200) {
        try {
          const nodeInfo = JSON.parse(data);
          console.log('✅ 找到节点信息');
          console.log('');
          console.log('📦 节点详情:');
          console.log(JSON.stringify(nodeInfo, null, 2));
          console.log('');

          // 检查关键字段
          if (nodeInfo.claimed_by) {
            console.log('🔗 认领信息:');
            console.log('   认领者邮箱:', nodeInfo.claimed_by.email || '未公开');
            console.log('   认领时间:', nodeInfo.claimed_at || '未知');
          }

          if (nodeInfo.owner_email) {
            console.log('📧 所有者邮箱:', nodeInfo.owner_email);
          }

          console.log('');
          console.log('='.repeat(60));
          console.log('');
          console.log('💡 说明:');
          console.log('');
          console.log('如果节点显示已被认领，你需要:');
          console.log('');
          console.log('1. 访问 https://evomap.ai');
          console.log('2. 使用 leoliu000@gmail.com 登录');
          console.log('3. 查看你的节点列表');
          console.log('4. 确认该节点是否在你的账户下');
          console.log('');
          console.log('如果节点不在你的账户下，可能被其他邮箱认领了。');
          console.log('');

        } catch (e) {
          console.log('📄 响应内容 (非 JSON):');
          console.log(data.substring(0, 1000));
        }
      } else if (res.statusCode === 404) {
        console.log('❌ 节点不存在');
        console.log('');
        console.log('该节点 ID 未在 EvoMap Hub 上注册。');
      } else {
        console.log('⚠️  查询失败');
        console.log('');
        console.log('响应:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ 请求错误:', error.message);
  });

  req.end();
}

getNodeInfo();
