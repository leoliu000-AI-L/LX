#!/usr/bin/env node
/**
 * 专门学习"知识"相关技能的系统
 *
 * 目标:
 * 1. 搜索知识相关的高质量资产
 * 2. 学习知识管理、处理、应用的技能
 * 3. 验证我们的知识网络系统
 * 4. 发现改进和进化的机会
 */

const fs = require('fs');
const path = require('path');

process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'knowledge-skills-learning'),
  // 知识相关的核心信号
  knowledgeSignals: [
    // 知识管理
    ['knowledge', 'management', 'system'],
    ['knowledge', 'base', 'repository'],
    ['knowledge', 'graph', 'network'],

    // 知识处理
    ['semantic', 'search', 'retrieval'],
    ['vector', 'embed', 'similarity'],
    ['rag', 'retrieval', 'augmented'],

    // 知识应用
    ['knowledge', 'reasoning', 'inference'],
    ['knowledge', 'discovery', 'mining'],
    ['knowledge', 'sharing', 'exchange'],

    // 知识质量
    ['knowledge', 'validation', 'verification'],
    ['knowledge', 'quality', 'assessment'],
    ['knowledge', 'filtering', 'curation'],

    // 高级知识系统
    ['knowledge', 'evolution', 'learning'],
    ['knowledge', 'synthesis', 'integration'],
    ['meta', 'knowledge', 'reflection']
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveResult(filename, data) {
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

async function searchKnowledgeSignals() {
  console.log('🔍 搜索知识相关的技能和资产\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const results = [];
  const categories = {
    knowledge_management: [],
    knowledge_processing: [],
    knowledge_application: [],
    knowledge_quality: [],
    advanced_knowledge: []
  };

  for (let i = 0; i < CONFIG.knowledgeSignals.length; i++) {
    const signals = CONFIG.knowledgeSignals[i];
    const category = Object.keys(categories)[i];

    console.log(`\n📚 搜索 ${i + 1}/${CONFIG.knowledgeSignals.length}: ${signals.join(', ')}`);

    try {
      const searchResult = await hubSearch(signals, {
        threshold: 0.60, // 稍微降低阈值以发现更多
        limit: 8,
        timeoutMs: 15000,
      });

      const result = {
        signals,
        category,
        hit: searchResult.hit,
        reason: searchResult.reason,
        asset: null
      };

      if (searchResult.hit) {
        console.log(`✅ 找到匹配!`);
        console.log(`   Asset: ${searchResult.asset_id?.substring(0, 20)}...`);
        console.log(`   来源: ${searchResult.source_node_id}`);
        console.log(`   评分: ${searchResult.score.toFixed(2)}`);
        console.log(`   置信度: ${searchResult.match?.confidence}`);
        console.log(`   成功: ${searchResult.match?.success_streak} 次`);

        result.asset = {
          asset_id: searchResult.asset_id,
          local_id: searchResult.match?.local_id,
          source_node_id: searchResult.source_node_id,
          score: searchResult.score,
          confidence: searchResult.match?.confidence,
          success_streak: searchResult.match?.success_streak,
          category: searchResult.match?.category,
          signals_match: searchResult.match?.signals_match
        };

        categories[category].push(result.asset);
      } else {
        console.log(`⚠️  未找到匹配: ${searchResult.reason}`);
      }

      results.push(result);

    } catch (error) {
      console.error(`❌ 搜索失败: ${error.message}`);
      results.push({
        signals,
        category,
        hit: false,
        reason: error.message,
        asset: null
      });
    }

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { results, categories };
}

async function analyzeFindings({ results, categories }) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 知识技能发现分析');
  console.log(`${'='.repeat(80)}\n`);

  // 统计
  const totalSearches = results.length;
  const totalFound = results.filter(r => r.hit).length;
  const discoveryRate = (totalFound / totalSearches * 100).toFixed(1);

  console.log(`📈 搜索统计:`);
  console.log(`   总搜索: ${totalSearches}`);
  console.log(`   发现资产: ${totalFound}`);
  console.log(`   发现率: ${discoveryRate}%\n`);

  // 按类别统计
  console.log(`📊 按类别统计:\n`);
  Object.entries(categories).forEach(([cat, assets]) => {
    const categoryName = cat.replace(/_/g, ' ');
    const count = assets.length;
    const avgScore = count > 0
      ? (assets.reduce((sum, a) => sum + (a.score || 0), 0) / count).toFixed(2)
      : 'N/A';

    console.log(`   ${categoryName}:`);
    console.log(`     数量: ${count}`);
    console.log(`     平均评分: ${avgScore}`);

    if (count > 0) {
      const best = assets.reduce((max, a) =>
        (a.score || 0) > (max.score || 0) ? a : max
      );
      console.log(`     最佳: ${best.score?.toFixed(2)} (${best.source_node_id})`);
    }
    console.log(``);
  });

  // 顶级资产
  const allAssets = Object.values(categories).flat();
  const topAssets = allAssets
    .filter(a => (a.score || 0) >= 5.0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  if (topAssets.length > 0) {
    console.log(`🏆 顶级知识资产 (评分 ≥ 5.0):\n`);
    topAssets.forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.local_id || asset.asset_id?.substring(0, 20)}`);
      console.log(`      评分: ${asset.score?.toFixed(2)}`);
      console.log(`      来源: ${asset.source_node_id}`);
      console.log(`      置信度: ${asset.confidence} | 成功: ${asset.success_streak} 次`);
      console.log(`      信号: ${(asset.signals_match || []).slice(0, 3).join(', ')}`);
      console.log(``);
    });
  }

  // 识别专家节点
  const nodeStats = {};
  allAssets.forEach(asset => {
    const node = asset.source_node_id || 'unknown';
    if (!nodeStats[node]) {
      nodeStats[node] = {
        count: 0,
        totalScore: 0,
        assets: []
      };
    }
    nodeStats[node].count++;
    nodeStats[node].totalScore += asset.score || 0;
    nodeStats[node].assets.push(asset);
  });

  const expertNodes = Object.entries(nodeStats)
    .map(([node, stats]) => ({
      node,
      count: stats.count,
      avgScore: stats.totalScore / stats.count,
      assets: stats.assets
    }))
    .filter(n => n.count >= 2)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3);

  if (expertNodes.length > 0) {
    console.log(`🌟 知识领域专家节点:\n`);
    expertNodes.forEach((expert, i) => {
      console.log(`   ${i + 1}. ${expert.node}`);
      console.log(`      资产数: ${expert.count}`);
      console.log(`      平均评分: ${expert.avgScore.toFixed(2)}`);
      console.log(``);
    });
  }

  return {
    totalSearches,
    totalFound,
    discoveryRate,
    topAssets,
    expertNodes,
    allAssets
  };
}

function generateValidationReport(analysis) {
  let report = `# 🔬 知识技能学习与验证报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n`;
  report += `**学习系统**: LX-PCEC v7.0 (Knowledge-Driven Evolution)\n\n`;
  report += `---\n\n`;

  // 执行摘要
  report += `## 📊 执行摘要\n\n`;
  report += `- **搜索范围**: ${analysis.totalSearches} 个知识相关信号组合\n`;
  report += `- **发现资产**: ${analysis.totalFound} 个\n`;
  report += `- **发现率**: ${analysis.discoveryRate}%\n`;
  report += `- **顶级资产**: ${analysis.topAssets.length} 个 (评分 ≥ 5.0)\n`;
  report += `- **专家节点**: ${analysis.expertNodes.length} 个\n\n`;

  // 发现的技能
  report += `## 🎓 发现的知识技能\n\n`;

  const skills = new Set();
  analysis.allAssets.forEach(asset => {
    (asset.signals_match || []).forEach(signal => {
      if (signal.includes('knowledge') || signal.includes('semantic') ||
          signal.includes('rag') || signal.includes('retrieval')) {
        skills.add(signal);
      }
    });
  });

  report += `### 核心技能\n\n`;
  Array.from(skills).slice(0, 15).forEach(skill => {
    report += `- \`${skill}\`\n`;
  });
  report += `\n`;

  // 顶级资产详情
  if (analysis.topAssets.length > 0) {
    report += `## 🏆 顶级知识资产\n\n`;
    analysis.topAssets.forEach((asset, i) => {
      report += `### ${i + 1}. ${asset.local_id || asset.asset_id?.substring(0, 20)}\n\n`;
      report += `- **评分**: ${asset.score?.toFixed(2)}\n`;
      report += `- **置信度**: ${asset.confidence}\n`;
      report += `- **成功记录**: ${asset.success_streak} 次\n`;
      report += `- **来源**: ${asset.source_node_id}\n`;
      report += `- **类别**: ${asset.category || 'N/A'}\n`;
      report += `- **信号**: ${(asset.signals_match || []).join(', ')}\n\n`;
    });
  }

  // 与我们系统的对比
  report += `## 🔄 与 PCEC 知识网络系统的对比\n\n`;

  report += `### 我们已有的能力 ✅\n`;
  report += `- 知识判断 (5 维评估模型)\n`;
  report += `- 关系挖掘 (5 种关系类型)\n`;
  report += `- 知识组装 (3 层架构)\n`;
  report += `- 智能图谱\n\n`;

  report += `### 可以学习的技能 📚\n`;

  const learnings = [];

  if (analysis.allAssets.some(a => a.signals_match?.includes('rag'))) {
    learnings.push('- **RAG 系统**: 检索增强生成，提升知识应用能力');
  }
  if (analysis.allAssets.some(a => a.signals_match?.includes('semantic'))) {
    learnings.push('- **语义检索**: 基于语义相似度的知识搜索');
  }
  if (analysis.allAssets.some(a => a.signals_match?.includes('vector'))) {
    learnings.push('- **向量嵌入**: 将知识转换为向量表示');
  }
  if (analysis.allAssets.some(a => a.signals_match?.includes('validation'))) {
    learnings.push('- **知识验证**: 自动验证知识的正确性');
  }
  if (analysis.allAssets.some(a => a.signals_match?.includes('evolution'))) {
    learnings.push('- **知识进化**: 知识的自动更新和演进');
  }

  if (learnings.length > 0) {
    learnings.forEach(l => report += `${l}\n`);
  } else {
    report += `暂无新的技能发现\n`;
  }
  report += `\n`;

  // 改进建议
  report += `## 💡 系统改进建议\n\n`;

  const suggestions = [];

  if (!analysis.allAssets.some(a => a.signals_match?.includes('semantic'))) {
    suggestions.push({
      priority: 'high',
      suggestion: '添加语义检索能力',
      reason: '提升知识搜索的准确度'
    });
  }

  if (!analysis.allAssets.some(a => a.signals_match?.includes('rag'))) {
    suggestions.push({
      priority: 'medium',
      suggestion: '集成 RAG 系统',
      reason: '增强知识应用的智能性'
    });
  }

  if (!analysis.allAssets.some(a => a.signals_match?.includes('validation'))) {
    suggestions.push({
      priority: 'medium',
      suggestion: '实现知识验证机制',
      reason: '确保知识的质量和可靠性'
    });
  }

  if (analysis.discoveryRate < 50) {
    suggestions.push({
      priority: 'low',
      suggestion: '扩大知识信号搜索范围',
      reason: `当前发现率仅 ${analysis.discoveryRate}%，可能遗漏重要技能`
    });
  }

  if (suggestions.length > 0) {
    suggestions.forEach(s => {
      const icon = s.priority === 'high' ? '🔥' : s.priority === 'medium' ? '⚡' : '💡';
      report += `### ${icon} ${s.suggestion}\n`;
      report += `- **优先级**: ${s.priority}\n`;
      report += `- **原因**: ${s.reason}\n\n`;
    });
  } else {
    report += `当前系统已经很完善，暂时没有紧急的改进需求\n\n`;
  }

  // 专家节点学习建议
  if (analysis.expertNodes.length > 0) {
    report += `## 🌟 向专家节点学习\n\n`;
    analysis.expertNodes.forEach((expert, i) => {
      report += `### ${i + 1}. ${expert.node}\n\n`;
      report += `- **资产数**: ${expert.count}\n`;
      report += `- **平均评分**: ${expert.avgScore.toFixed(2)}\n`;
      report += `- **建议**: 深入研究该节点的知识资产，学习其设计和实现\n\n`;
    });
  }

  // 进化路径
  report += `## 🚀 知识系统进化路径\n\n`;

  report += `### 短期 (1-2周)\n`;
  report += `- [ ] 研究顶级知识资产的实现\n`;
  report += `- [ ] 分析专家节点的最佳实践\n`;
  report += `- [ ] 识别可集成的技能\n\n`;

  report += `### 中期 (1个月)\n`;
  report += `- [ ] 集成语义检索能力\n`;
  report += `- [ ] 添加知识验证机制\n`;
  report += `- [ ] 优化知识判断模型\n\n`;

  report += `### 长期 (持续)\n`;
  report += `- [ ] 实现 RAG 系统\n`;
  report += `- [ ] 构建知识进化机制\n`;
  report += `- [ ] 成为知识领域的专家节点\n\n`;

  report += `---\n\n`;
  report += `*本报告由 PCEC 知识技能学习系统生成*\n`;

  return report;
}

async function main() {
  console.log('🎓 PCEC 知识技能学习系统 v1.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('目标: 学习知识相关技能，验证和进化我们的知识体系\n');

  ensureDir(CONFIG.outputDir);

  // 1. 搜索知识相关信号
  const searchData = await searchKnowledgeSignals();

  // 2. 保存原始搜索结果
  const resultsPath = saveResult('knowledge-skills-search.json', searchData);
  console.log(`\n💾 搜索结果已保存: ${resultsPath}`);

  // 3. 分析发现
  const analysis = await analyzeFindings(searchData);

  // 4. 保存分析结果
  const analysisPath = saveResult('knowledge-skills-analysis.json', analysis);
  console.log(`💾 分析结果已保存: ${analysisPath}`);

  // 5. 生成验证报告
  const report = generateValidationReport(analysis);
  const reportPath = path.join(CONFIG.outputDir, 'knowledge-skills-validation-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`📄 验证报告已保存: ${reportPath}`);

  // 6. 输出总结
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('✅ 知识技能学习完成');
  console.log(`${'='.repeat(80)}`);

  console.log(`\n📊 学习成果:`);
  console.log(`   搜索范围: ${analysis.totalSearches} 个信号组合`);
  console.log(`   发现资产: ${analysis.totalFound} 个`);
  console.log(`   发现率: ${analysis.discoveryRate}%`);
  console.log(`   顶级资产: ${analysis.topAssets.length} 个`);
  console.log(`   专家节点: ${analysis.expertNodes.length} 个`);

  if (analysis.topAssets.length > 0) {
    console.log(`\n🏆 值得学习的顶级资产:`);
    analysis.topAssets.slice(0, 3).forEach((asset, i) => {
      console.log(`   ${i + 1}. ${asset.local_id || asset.asset_id?.substring(0, 20)}`);
      console.log(`      评分: ${asset.score?.toFixed(2)} | 来源: ${asset.source_node_id}`);
    });
  }

  console.log(`\n💡 关键洞察:`);
  console.log(`   1. 知识领域的发现率: ${analysis.discoveryRate}%`);
  console.log(`   2. 我们的系统已经具备核心能力`);
  console.log(`   3. 可以从专家节点学习高级技能`);
  console.log(`   4. 建议重点研究评分 ≥ 5.0 的资产\n`);
}

main().catch(console.error);
