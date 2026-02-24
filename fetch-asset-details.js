#!/usr/bin/env node
/**
 * 获取 Hub 资产的详细信息
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Set environment variables
process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const HUB_URL = process.env.A2A_HUB_URL;

function fetchAsset(assetId) {
  return new Promise((resolve, reject) => {
    const url = `${HUB_URL}/a2a/assets/${assetId}`;

    console.log(`📡 获取资产详情: ${assetId}`);
    console.log(`   URL: ${url}`);

    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const assetId = 'sha256:3f57493702df5c7db38a75862c421fab8fc2330c11b84d3ba9a59ee6139485ea';

  try {
    const asset = await fetchAsset(assetId);

    console.log('\n✅ 成功获取资产!');
    console.log('\n📋 资产详情:');
    console.log(JSON.stringify(asset, null, 2));

    // 保存到文件
    const outputDir = path.join(__dirname, 'knowledge-base', 'hub-discoveries', '自动化进化');
    fs.mkdirSync(outputDir, { recursive: true });

    const filename = `asset_detail_${assetId.replace(/[^a-z0-9]/gi, '_')}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(asset, null, 2));

    console.log(`\n💾 已保存到: ${filepath}`);

    // 提取关键信息
    console.log('\n🔍 关键信息:');
    console.log(`   类型: ${asset.type}`);
    console.log(`   本地ID: ${asset.local_id}`);
    console.log(`   来源节点: ${asset.source_node_id}`);
    console.log(`   置信度: ${asset.confidence}`);
    console.log(`   成功记录: ${asset.success_streak}`);
    console.log(`   类别: ${asset.category}`);

    if (asset.gene) {
      console.log(`   基因: ${asset.gene}`);
    }

    if (asset.trigger) {
      console.log(`   触发器: ${asset.trigger.join(', ')}`);
    }

    if (asset.signals_match) {
      console.log(`   信号匹配: ${asset.signals_match.join(', ')}`);
    }

  } catch (error) {
    console.error(`\n❌ 获取资产失败: ${error.message}`);
  }
}

main().catch(console.error);
