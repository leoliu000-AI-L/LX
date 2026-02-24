#!/usr/bin/env node
/**
 * 主动获取合作伙伴的知识
 * 从高声誉智能体学习最佳实践
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  hubUrl: 'evomap.ai',
  outputDir: path.join(__dirname, 'knowledge-base', 'partners'),
  // 重点学习的智能体
  targetAgents: [
    { nodeId: 'node_xiazi_openclaw', name: '麻小', reason: 'OpenClaw专家, 2834个资产' },
    { nodeId: 'node_edb4f25012404826', name: 'Evolve专家', reason: 'evolve, publish, validate能力' },
    { nodeId: 'node_eva', name: 'EVA', reason: 'OpenClaw bridge-loop, 1227个资产' },
    { nodeId: 'node_599d0630a50106dc', name: 'OpenClaw Agent', reason: 'openclaw-agent能力' },
  ]
};

function httpsGet(options) {
  return new Promise((resolve, reject) => {
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function getAgentAssets(nodeId, limit = 50) {
  console.log(`\n📚 获取 ${nodeId} 的资产...`);

  const options = {
    hostname: CONFIG.hubUrl,
    path: `/api/node/${nodeId}/capsules?limit=${limit}`,
    headers: {
      'User-Agent': 'LX-PCEC/7.0'
    }
  };

  try {
    const data = await httpsGet(options);

    // 调试输出
    console.log(`   API 返回类型: ${typeof data}`);
    if (typeof data === 'string') {
      console.log(`   前100字符: ${data.substring(0, 100)}`);
      return [];
    }

    // 尝试多种可能的格式
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (data && Array.isArray(data.capsules)) {
      return data.capsules;
    }

    console.log(`   未知格式, 路径: ${data}`);
    return [];
  } catch (error) {
    console.error(`❌ 获取资产失败: ${error.message}`);
    return [];
  }
}

async function getAgentGenes(nodeId, limit = 50) {
  console.log(`\n🧬 获取 ${nodeId} 的基因...`);

  const options = {
    hostname: CONFIG.hubUrl,
    path: `/api/node/${nodeId}/genes?limit=${limit}`,
    headers: {
      'User-Agent': 'LX-PCEC/7.0'
    }
  };

  try {
    const data = await httpsGet(options);

    // 调试输出
    console.log(`   API 返回类型: ${typeof data}`);
    if (typeof data === 'string') {
      console.log(`   前100字符: ${data.substring(0, 100)}`);
      return [];
    }

    // 尝试多种可能的格式
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (data && Array.isArray(data.genes)) {
      return data.genes;
    }

    console.log(`   未知格式, 路径: ${data}`);
    return [];
  } catch (error) {
    console.error(`❌ 获取基因失败: ${error.message}`);
    return [];
  }
}

async function analyzeAndLearn(agentInfo, assets, genes) {
  console.log(`\n\n🔍 分析 ${agentInfo.name} 的知识...`);
  console.log(`📋 ${agentInfo.reason}`);
  console.log(`═════════════════════════════════════════`);

  // 确保数据是数组
  if (!Array.isArray(assets)) {
    console.log(`⚠️  资产数据不是数组,跳过分析`);
    assets = [];
  }
  if (!Array.isArray(genes)) {
    console.log(`⚠️  基因数据不是数组,跳过分析`);
    genes = [];
  }

  console.log(`\n📊 数据统计:`);
  console.log(`  资产数: ${assets.length}`);
  console.log(`  基因数: ${genes.length}`);

  if (assets.length === 0 && genes.length === 0) {
    console.log(`\n⚠️  没有可分析的数据`);
    return null;
  }

  // 分析资产类别
  const assetCategories = {};
  const capabilities = new Set();
  const signals = new Set();

  assets.forEach(asset => {
    const category = asset.category || 'unknown';
    assetCategories[category] = (assetCategories[category] || 0) + 1;

    if (asset.trigger) {
      asset.trigger.forEach(t => capabilities.add(t));
    }
    if (asset.signals_match) {
      asset.signals_match.forEach(s => signals.add(s));
    }
  });

  // 分析基因
  const geneCategories = {};
  const geneStrategies = new Set();

  genes.forEach(gene => {
    const category = gene.category || 'unknown';
    geneCategories[category] = (geneCategories[category] || 0) + 1;

    if (gene.summary) {
      geneStrategies.add(gene.summary);
    }
  });

  console.log('\n📊 资产分析:');
  console.log(`  总资产数: ${assets.length}`);
  console.log(`  类别分布:`);
  Object.entries(assetCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => {
      console.log(`    - ${cat}: ${count}`);
    });

  console.log('\n🧬 基因分析:');
  console.log(`  总基因数: ${genes.length}`);
  console.log(`  类别分布:`);
  Object.entries(geneCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => {
      console.log(`    - ${cat}: ${count}`);
    });

  console.log('\n⚡ 能力标签:');
  Array.from(capabilities).slice(0, 20).forEach(cap => {
    console.log(`  - ${cap}`);
  });

  console.log('\n🎯 策略示例:');
  Array.from(geneStrategies).slice(0, 5).forEach(strategy => {
    console.log(`  - ${strategy}`);
  });

  // 提取学习要点
  const learningPoints = extractLearningPoints(assets, genes);
  console.log('\n💡 学习要点:');
  learningPoints.forEach(point => {
    console.log(`  ✓ ${point}`);
  });

  return {
    agentInfo,
    assetCategories,
    geneCategories,
    capabilities: Array.from(capabilities),
    signals: Array.from(signals),
    learningPoints,
    topAssets: assets.slice(0, 10),
    topGenes: genes.slice(0, 10)
  };
}

function extractLearningPoints(assets, genes) {
  const points = [];

  // 从资产中学习
  const categoryCounts = {};
  assets.forEach(asset => {
    const cat = asset.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  topCategories.forEach(([cat, count]) => {
    points.push(`${cat} 类别的资产有 ${count} 个,可以学习其模式`);
  });

  // 从基因中学习
  const innovateGenes = genes.filter(g => g.category === 'innovate');
  if (innovateGenes.length > 0) {
    points.push(`有 ${innovateGenes.length} 个创新类基因,可以了解其创新思路`);
  }

  const robustGenes = genes.filter(g => g.category === 'robust');
  if (robustGenes.length > 0) {
    points.push(`有 ${robustGenes.length} 个健壮性类基因,可以学习其稳定性策略`);
  }

  // 特殊检测
  const openclawAssets = assets.filter(a =>
    a.signals_match && a.signals_match.includes('openclaw')
  );
  if (openclawAssets.length > 0) {
    points.push(`发现 ${openclawAssets.length} 个 OpenClaw 相关资产,值得深入研究`);
  }

  const multiAgentAssets = assets.filter(a =>
    a.signals_match && (
      a.signals_match.includes('multi_agent') ||
      a.signals_match.includes('collaboration')
    )
  );
  if (multiAgentAssets.length > 0) {
    points.push(`发现 ${multiAgentAssets.length} 个多智能体相关资产,可以借鉴协作模式`);
  }

  return points;
}

async function saveKnowledge(agentId, knowledge) {
  const outputDir = path.join(CONFIG.outputDir, agentId);
  fs.mkdirSync(outputDir, { recursive: true });

  // 保存分析报告
  const reportPath = path.join(outputDir, 'analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(knowledge, null, 2));
  console.log(`\n💾 已保存分析报告: ${reportPath}`);

  // 保存顶级资产
  if (knowledge.topAssets && knowledge.topAssets.length > 0) {
    const assetsPath = path.join(outputDir, 'top-assets.json');
    fs.writeFileSync(assetsPath, JSON.stringify(knowledge.topAssets, null, 2));
    console.log(`💾 已保存顶级资产: ${assetsPath}`);
  }

  // 保存顶级基因
  if (knowledge.topGenes && knowledge.topGenes.length > 0) {
    const genesPath = path.join(outputDir, 'top-genes.json');
    fs.writeFileSync(genesPath, JSON.stringify(knowledge.topGenes, null, 2));
    console.log(`💾 已保存顶级基因: ${genesPath}`);
  }

  // 生成学习建议
  const advice = generateLearningAdvice(knowledge);
  const advicePath = path.join(outputDir, 'learning-advice.md');
  fs.writeFileSync(advicePath, advice);
  console.log(`💾 已保存学习建议: ${advicePath}`);
}

function generateLearningAdvice(knowledge) {
  const { agentInfo, assetCategories, geneCategories, capabilities, learningPoints } = knowledge;

  let advice = `# 🧠 从 ${agentInfo.name} 学习\n\n`;
  advice += `**节点ID**: ${agentInfo.nodeId}\n`;
  advice += `**特色**: ${agentInfo.reason}\n\n`;
  advice += `---\n\n`;

  advice += `## 📊 知识概览\n\n`;
  advice += `### 资产类别\n`;
  Object.entries(assetCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => {
      advice += `- **${cat}**: ${count} 个\n`;
    });

  advice += `\n### 基因类别\n`;
  Object.entries(geneCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => {
      advice += `- **${cat}**: ${count} 个\n`;
    });

  advice += `\n### 能力标签\n`;
  capabilities.slice(0, 20).forEach(cap => {
    advice += `- \`${cap}\`\n`;
  });

  advice += `\n---\n\n`;
  advice += `## 💡 学习建议\n\n`;
  learningPoints.forEach((point, i) => {
    advice += `${i + 1}. ${point}\n`;
  });

  advice += `\n---\n\n`;
  advice += `## 🎯 行动计划\n\n`;
  advice += `### 短期 (1-2周)\n`;
  advice += `- [ ] 研究该智能体的顶级资产\n`;
  advice += `- [ ] 学习其使用的核心能力标签\n`;
  advice += `- [ ] 分析其基因策略\n`;
  advice += `- [ ] 尝试应用相似的方法\n\n`;

  advice += `### 中期 (1个月)\n`;
  advice += `- [ ] 整合学习到的知识到自己的系统\n`;
  advice += `- [ ] 创建改进版本的资产\n`;
  advice += `- [ ] 与该智能体建立联系并交流\n\n`;

  advice += `### 长期 (持续)\n`;
  advice += `- [ ] 持续关注该智能体的新资产\n`;
  advice += `- [ ] 建立知识共享机制\n`;
  advice += `- [ ] 开展协作项目\n\n`;

  advice += `---\n\n`;
  advice += `*生成时间: ${new Date().toISOString()}\n`;
  advice += `*生成者: LX-PCEC v7.0 (Multi-Agent Collaboration Edition)\n`;

  return advice;
}

async function main() {
  console.log('🧠 PCEC 主动学习系统');
  console.log('═════════════════════════════════════════');
  console.log(`目标: 从 ${CONFIG.targetAgents.length} 个优质智能体学习最佳实践\n`);

  fs.mkdirSync(CONFIG.outputDir, { recursive: true });

  for (const agent of CONFIG.targetAgents) {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`🤖 学习对象: ${agent.name}`);
    console.log(`${'='.repeat(60)}`);

    // 获取资产和基因
    const assets = await getAgentAssets(agent.nodeId, 100);
    const genes = await getAgentGenes(agent.nodeId, 100);

    if (assets.length === 0 && genes.length === 0) {
      console.log(`⚠️  未获取到数据,跳过 ${agent.name}`);
      continue;
    }

    // 分析和学习
    const knowledge = await analyzeAndLearn(agent, assets, genes);

    // 保存知识
    await saveKnowledge(agent.nodeId.replace('node_', ''), knowledge);

    console.log(`\n✅ 完成 ${agent.name} 的知识获取`);
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📈 学习总结');
  console.log(`${'='.repeat(60)}`);
  console.log(`\n✅ 已完成所有目标智能体的知识获取`);
  console.log(`📁 知识库路径: ${CONFIG.outputDir}`);
  console.log(`\n下一步:`);
  console.log(`  1. 查看各智能体的学习建议`);
  console.log(`  2. 整合有用的知识到自己的系统`);
  console.log(`  3. 创建改进版本的资产`);
  console.log(`  4. 与这些智能体建立联系\n`);
}

main().catch(console.error);
