/**
 * 发布 GEP 资产到 EvoMap Hub (修正版)
 * 基于 https://evomap.ai/skill.md 的正确协议
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Canonical JSON stringify - recursively sorts ALL keys at EVERY nesting level
 * This is required for deterministic SHA256 hash computation
 */
function canonicalStringify(obj) {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalStringify(item)).join(',') + ']';
  }

  // Object: sort keys recursively
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    const value = canonicalStringify(obj[key]);
    return JSON.stringify(key) + ':' + value;
  });

  return '{' + pairs.join(',') + '}';
}

/**
 * 计算 SHA256 asset_id
 * 规则：sha256(canonical_json(asset_without_asset_id))
 * 其中 canonical_json 必须在每一层嵌套中都排序键
 */
function computeAssetId(asset) {
  // 复制资产对象并移除 asset_id 字段
  const { asset_id, ...assetForHash } = asset;

  // Canonical JSON: recursively sort ALL keys at every nesting level
  const canonical = canonicalStringify(assetForHash);

  // 计算 SHA256
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * 发布资产包（Gene + Capsule + EvolutionEvent）
 */
async function publishBundle(genePath, capsulePath, eventPath, nodeId, hubUrl) {
  // 读取资产
  const gene = JSON.parse(fs.readFileSync(genePath, 'utf8'));
  const capsule = JSON.parse(fs.readFileSync(capsulePath, 'utf8'));
  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  // 1. 先计算 Gene 的 asset_id
  const geneId = computeAssetId(gene);
  gene.asset_id = `sha256:${geneId}`;

  // 2. 添加 gene 字段到 Capsule（必须在计算 hash 之前）
  capsule.gene = `sha256:${geneId}`;
  const capsuleId = computeAssetId(capsule);
  capsule.asset_id = `sha256:${capsuleId}`;

  // 3. 添加 capsule_id 和 genes_used 到 Event（必须在计算 hash 之前）
  event.capsule_id = `sha256:${capsuleId}`;
  if (event.genes_used && event.genes_used.length > 0) {
    event.genes_used = [`sha256:${geneId}`];
  }
  const eventId = computeAssetId(event);
  event.asset_id = `sha256:${eventId}`;

  const message = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'publish',
    message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    sender_id: nodeId,
    timestamp: new Date().toISOString(),
    payload: {
      assets: [gene, capsule, event]
    }
  };

  console.log(`📤 发布资产包:`);
  console.log(`   Gene: ${gene.name || gene.id}`);
  console.log(`   Capsule: ${capsule.name || capsule.id}`);
  console.log(`   Event: ${event.name || event.id}`);
  console.log(``);

  try {
    const response = await fetch(`${hubUrl}/a2a/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(30000)
    });

    const data = await response.json();

    if (response.ok && data.payload?.status === 'success') {
      console.log(`   ✅ 发布成功！`);
      console.log(`   Gene ID: sha256:${geneId}`);
      console.log(`   Capsule ID: sha256:${capsuleId}`);
      console.log(`   Event ID: sha256:${eventId}`);
      return {
        success: true,
        gene_id: `sha256:${geneId}`,
        capsule_id: `sha256:${capsuleId}`,
        event_id: `sha256:${eventId}`
      };
    } else {
      console.log(`   ❌ 发布失败: ${JSON.stringify(data.payload || data)}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   ❌ 网络错误: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function publishAllBundles() {
  const nodeId = process.env.A2A_NODE_ID || 'node_514d17ec9eaa04a4';
  const hubUrl = process.env.A2A_HUB_URL || 'https://evomap.ai';

  console.log('🚀 开始发布 GEP 资产包到 EvoMap Hub');
  console.log(`📍 节点 ID: ${nodeId}`);
  console.log(`🌐 Hub URL: ${hubUrl}`);
  console.log(`📋 协议: GEP-A2A v1.0.0`);
  console.log('');

  const genesDir = path.join(__dirname, '..', 'assets', 'gep', 'genes');
  const capsulesDir = path.join(__dirname, '..', 'assets', 'gep', 'capsules');
  const eventsDir = path.join(__dirname, '..', 'assets', 'gep', 'events');

  // 收集资产包
  const bundles = [];

  // Phase 6: Feishu 集成
  if (fs.existsSync(path.join(genesDir, 'gene_pcec_feishu_integration.json'))) {
    bundles.push({
      gene: path.join(genesDir, 'gene_pcec_feishu_integration.json'),
      capsule: path.join(capsulesDir, 'capsule_pcec_feishu_integration_20250223.json'),
      event: path.join(eventsDir, 'evt_pcec_feishu_integration_20250223.json')
    });
  }

  // Phase 5: 安全增强
  if (fs.existsSync(path.join(genesDir, 'gene_pcec_security_enhancement.json'))) {
    bundles.push({
      gene: path.join(genesDir, 'gene_pcec_security_enhancement.json'),
      capsule: path.join(capsulesDir, 'capsule_pcec_security_enhancement_20250223.json'),
      event: path.join(eventsDir, 'evt_pcec_security_enhancement_20250223.json')
    });
  }

  // Phase 4: 知识系统化
  if (fs.existsSync(path.join(genesDir, 'gene_pcec_knowledge_systematization.json'))) {
    bundles.push({
      gene: path.join(genesDir, 'gene_pcec_knowledge_systematization.json'),
      capsule: path.join(capsulesDir, 'capsule_pcec_knowledge_systematization_20250223.json'),
      event: path.join(eventsDir, 'evt_pcec_complete_evolution_20250223.json')
    });
  }

  // Phase 3: 诊断集成
  if (fs.existsSync(path.join(genesDir, 'gene_pcec_diagnostic_integration.json'))) {
    bundles.push({
      gene: path.join(genesDir, 'gene_pcec_diagnostic_integration.json'),
      capsule: path.join(capsulesDir, 'capsule_pcec_diagnostic_integration_20250223.json'),
      event: path.join(eventsDir, 'evt_pcec_diagnostic_integration_20250223.json')
    });
  }

  // Phase 2: 进程智能管理
  if (fs.existsSync(path.join(genesDir, 'gene_pcec_process_intelligence.json'))) {
    bundles.push({
      gene: path.join(genesDir, 'gene_pcec_process_intelligence.json'),
      capsule: path.join(capsulesDir, 'capsule_pcec_process_intelligence_20250223.json'),
      event: path.join(eventsDir, 'evt_pcec_process_intelligence_20250223.json')
    });
  }

  // Phase 1: 环境健壮性
  if (fs.existsSync(path.join(genesDir, 'gene_pcec_environment_robustness.json'))) {
    bundles.push({
      gene: path.join(genesDir, 'gene_pcec_environment_robustness.json'),
      capsule: path.join(capsulesDir, 'capsule_pcec_environment_robustness_20250223.json'),
      event: path.join(eventsDir, 'evt_pcec_environment_robustness_20250223.json')
    });
  }

  console.log(`📦 找到 ${bundles.length} 个资产包`);
  console.log('');

  const results = {
    total: bundles.length,
    success: 0,
    failed: 0,
    bundles: []
  };

  // 发布每个资产包
  for (const bundle of bundles) {
    const result = await publishBundle(bundle.gene, bundle.capsule, bundle.event, nodeId, hubUrl);
    results.bundles.push({
      gene: path.basename(bundle.gene),
      ...result
    });

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }

    // 避免速率限制
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('');
  console.log('📊 发布统计:');
  console.log(`   总计: ${results.total}`);
  console.log(`   成功: ${results.success}`);
  console.log(`   失败: ${results.failed}`);
  console.log('');

  // 保存发布记录
  const publishLog = path.join(__dirname, '..', 'logs', 'publish-log.jsonl');
  try {
    const logDir = path.dirname(publishLog);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      results: results
    };

    fs.appendFileSync(publishLog, JSON.stringify(logEntry) + '\n');
    console.log(`📝 发布记录已保存到: ${publishLog}`);
  } catch (error) {
    console.log(`⚠️  无法保存发布记录: ${error.message}`);
  }

  return results;
}

// 主函数
if (require.main === module) {
  publishAllBundles().then(results => {
    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }).catch(error => {
    console.error('💥 发布失败:', error);
    process.exit(1);
  });
}

module.exports = { computeAssetId, publishBundle, publishAllBundles };
