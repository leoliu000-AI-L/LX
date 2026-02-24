#!/usr/bin/env node
/**
 * 主动学习系统 - 通过 Hub 搜索获取其他智能体的知识
 *
 * 策略:
 * 1. 搜索特定的能力信号,找到优质资产
 * 2. 分析资产结构,学习最佳实践
 * 3. 提取有用的模式和策略
 * 4. 整合到自己的知识库
 */

const fs = require('fs');
const path = require('path');

// Set environment variables directly
process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';
process.env.EVOLVER_REUSE_MODE = 'reference';
process.env.EVOLVER_MIN_REUSE_SCORE = '0.72';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'hub-discoveries'),
  // 要学习的能力领域
  learningTopics: [
    {
      name: '多智能体协作',
      signals: ['multi_agent', 'collaboration', 'coordination', 'swarm', 'session'],
      priority: 'high'
    },
    {
      name: 'OpenClaw 集成',
      signals: ['openclaw', 'skill', 'tool', 'integration'],
      priority: 'high'
    },
    {
      name: '自动化进化',
      signals: ['auto_evolve', 'loop', 'automation', 'continuous'],
      priority: 'high'
    },
    {
      name: '知识管理',
      signals: ['knowledge', 'memory', 'semantic', 'retrieval', 'rag'],
      priority: 'medium'
    },
    {
      name: '监控诊断',
      signals: ['monitor', 'diagnostic', 'health_check', 'recovery'],
      priority: 'medium'
    },
    {
      name: '安全防护',
      signals: ['security', 'auth', 'validation', 'sanitize'],
      priority: 'medium'
    },
    {
      name: '企业集成',
      signals: ['feishu', 'slack', 'webhook', 'notification', 'enterprise'],
      priority: 'low'
    },
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveDiscovery(topic, asset, analysis) {
  const topicDir = path.join(CONFIG.outputDir, topic.slug);
  ensureDir(topicDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${asset.asset_id?.replace(/[^a-z0-9]/gi, '_') || 'unknown'}.json`;
  const filepath = path.join(topicDir, filename);

  const discovery = {
    timestamp: new Date().toISOString(),
    topic: topic.name,
    asset: {
      asset_id: asset.asset_id,
      local_id: asset.local_id,
      source_node_id: asset.source_node_id,
      confidence: asset.confidence,
      success_streak: asset.success_streak,
      status: asset.status,
      signals_match: asset.signals_match,
      category: asset.category,
    },
    analysis,
  };

  fs.writeFileSync(filepath, JSON.stringify(discovery, null, 2));
  return filepath;
}

function analyzeAsset(asset) {
  const analysis = {
    strengths: [],
    patterns: [],
    capabilities: [],
    recommendations: [],
  };

  // 分析能力
  if (asset.signals_match && Array.isArray(asset.signals_match)) {
    analysis.capabilities = asset.signals_match;

    // 识别模式
    if (asset.signals_match.includes('multi_agent') || asset.signals_match.includes('collaboration')) {
      analysis.patterns.push('多智能体协作模式');
      analysis.recommendations.push('可以借鉴其协作架构设计');
    }

    if (asset.signals_match.includes('openclaw')) {
      analysis.patterns.push('OpenClaw 集成模式');
      analysis.recommendations.push('可以学习其 OpenClaw 使用方式');
    }

    if (asset.signals_match.includes('automation') || asset.signals_match.includes('loop')) {
      analysis.patterns.push('自动化循环模式');
      analysis.recommendations.push('可以参考其自动化设计');
    }

    if (asset.signals_match.includes('monitor') || asset.signals_match.includes('diagnostic')) {
      analysis.patterns.push('监控诊断模式');
      analysis.recommendations.push('可以学习其监控策略');
    }
  }

  // 分析质量指标
  const confidence = asset.confidence || 0;
  const streak = asset.success_streak || 0;

  if (confidence >= 0.9) {
    analysis.strengths.push(`极高置信度: ${confidence}`);
  } else if (confidence >= 0.8) {
    analysis.strengths.push(`高置信度: ${confidence}`);
  }

  if (streak >= 10) {
    analysis.strengths.push(`稳定成功记录: ${streak} 次`);
  } else if (streak >= 5) {
    analysis.strengths.push(`良好成功记录: ${streak} 次`);
  }

  // 分析类别
  if (asset.category) {
    analysis.recommendations.push(`类别: ${asset.category}, 可以了解该类别的最佳实践`);
  }

  return analysis;
}

async function learnFromTopic(topic) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📚 学习主题: ${topic.name}`);
  console.log(`🎯 信号: ${topic.signals.join(', ')}`);
  console.log(`⭐ 优先级: ${topic.priority}`);
  console.log(`${'='.repeat(70)}`);

  const slug = topic.name.toLowerCase().replace(/\s+/g, '-');
  const results = {
    topic: topic.name,
    slug,
    signals: topic.signals,
    priority: topic.priority,
    discoveries: [],
    summary: {
      totalFound: 0,
      highQuality: 0,
      topSources: new Map(),
    },
  };

  // 搜索资产
  const searchResult = await hubSearch(topic.signals, {
    threshold: 0.65, // 稍微降低阈值以获取更多候选项
    limit: 10,
    timeoutMs: 15000,
  });

  if (!searchResult.hit) {
    console.log(`\n⚠️  未找到匹配的资产`);
    console.log(`   原因: ${searchResult.reason || 'unknown'}`);
    if (searchResult.candidates) {
      console.log(`   候选数: ${searchResult.candidates}`);
    }
    return results;
  }

  // 分析找到的资产
  console.log(`\n✅ 找到高质量资产!`);
  console.log(`   Asset ID: ${searchResult.asset_id}`);
  console.log(`   来源节点: ${searchResult.source_node_id}`);
  console.log(`   评分: ${searchResult.score.toFixed(3)}`);
  console.log(`   模式: ${searchResult.mode}`);

  results.summary.totalFound = 1;
  results.summary.highQuality = 1;
  results.summary.topSources.set(searchResult.source_node_id, 1);

  // 分析资产
  const analysis = analyzeAsset(searchResult.match);
  const filepath = saveDiscovery({ slug, name: topic.name }, searchResult.match, analysis);

  console.log(`\n📊 分析结果:`);
  console.log(`   优势:`);
  analysis.strengths.forEach(s => console.log(`     ✓ ${s}`));

  if (analysis.patterns.length > 0) {
    console.log(`   识别的模式:`);
    analysis.patterns.forEach(p => console.log(`     • ${p}`));
  }

  console.log(`   建议:`);
  analysis.recommendations.forEach(r => console.log(`     → ${r}`));

  console.log(`\n💾 已保存到: ${filepath}`);

  results.discoveries.push({
    asset_id: searchResult.asset_id,
    source_node_id: searchResult.source_node_id,
    score: searchResult.score,
    analysis,
    filepath,
  });

  return results;
}

async function generateLearningReport(allResults) {
  const reportPath = path.join(CONFIG.outputDir, 'learning-report.md');
  let report = `# 🧠 主动学习报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n`;
  report += `**学习系统**: LX-PCEC v7.0\n\n`;
  report += `---\n\n`;

  // 总览
  report += `## 📊 学习总览\n\n`;
  const totalTopics = allResults.length;
  const topicsWithDiscoveries = allResults.filter(r => r.summary.totalFound > 0).length;
  const totalDiscoveries = allResults.reduce((sum, r) => sum + r.summary.totalFound, 0);
  const highQualityDiscoveries = allResults.reduce((sum, r) => sum + r.summary.highQuality, 0);

  report += `- **学习主题数**: ${totalTopics}\n`;
  report += `- **有发现的主题**: ${topicsWithDiscoveries}\n`;
  report += `- **总发现数**: ${totalDiscoveries}\n`;
  report += `- **高质量发现**: ${highQualityDiscoveries}\n\n`;

  // 按优先级分组
  report += `## 🎯 按优先级分组\n\n`;

  const highPriority = allResults.filter(r => r.priority === 'high' && r.summary.totalFound > 0);
  const mediumPriority = allResults.filter(r => r.priority === 'medium' && r.summary.totalFound > 0);
  const lowPriority = allResults.filter(r => r.priority === 'low' && r.summary.totalFound > 0);

  if (highPriority.length > 0) {
    report += `### ⭐ 高优先级发现\n\n`;
    highPriority.forEach(result => {
      report += `#### ${result.topic}\n`;
      report += `- 信号: ${result.signals.join(', ')}\n`;
      report += `- 发现数: ${result.summary.totalFound}\n`;
      result.discoveries.forEach(d => {
        report += `  - [${d.asset_id}] 来自 ${d.source_node_id} (评分: ${d.score.toFixed(3)})\n`;
      });
      report += `\n`;
    });
  }

  if (mediumPriority.length > 0) {
    report += `### 📈 中优先级发现\n\n`;
    mediumPriority.forEach(result => {
      report += `#### ${result.topic}\n`;
      report += `- 发现数: ${result.summary.totalFound}\n`;
      result.discoveries.forEach(d => {
        report += `  - [${d.asset_id}] 来自 ${d.source_node_id} (评分: ${d.score.toFixed(3)})\n`;
      });
      report += `\n`;
    });
  }

  if (lowPriority.length > 0) {
    report += `### 📉 低优先级发现\n\n`;
    lowPriority.forEach(result => {
      report += `#### ${result.topic}\n`;
      report += `- 发现数: ${result.summary.totalFound}\n`;
      result.discoveries.forEach(d => {
        report += `  - [${d.asset_id}] 来自 ${d.source_node_id} (评分: ${d.score.toFixed(3)})\n`;
      });
      report += `\n`;
    });
  }

  // 详细发现
  report += `## 📋 详细发现\n\n`;
  allResults.forEach(result => {
    if (result.summary.totalFound === 0) return;

    report += `### ${result.topic}\n\n`;
    report += `**信号**: ${result.signals.join(', ')}\n`;
    report += `**优先级**: ${result.priority}\n\n`;

    result.discoveries.forEach(d => {
      report += `#### ${d.asset_id}\n\n`;
      report += `- **来源**: ${d.source_node_id}\n`;
      report += `- **评分**: ${d.score.toFixed(3)}\n`;
      report += `- **优势**:\n`;
      d.analysis.strengths.forEach(s => report += `  - ${s}\n`);
      if (d.analysis.patterns.length > 0) {
        report += `- **识别的模式**:\n`;
        d.analysis.patterns.forEach(p => report += `  - ${p}\n`);
      }
      report += `- **建议**:\n`;
      d.analysis.recommendations.forEach(r => report += `  - ${r}\n`);
      report += `\n`;
    });
  });

  // 行动计划
  report += `## 🎯 下一步行动\n\n`;
  report += `### 短期 (1-2周)\n`;
  report += `- [ ] 深入研究高优先级的发现\n`;
  report += `- [ ] 提取可复用的模式和策略\n`;
  report += `- [ ] 在本地测试学到的技术\n\n`;

  report += `### 中期 (1个月)\n`;
  report += `- [ ] 将学到的知识整合到 PCEC 系统\n`;
  report += `- [ ] 创建改进版本的资产\n`;
  report += `- [ ] 与资产来源的智能体建立联系\n\n`;

  report += `### 长期 (持续)\n`;
  report += `- [ ] 持续监控 Hub 上的新资产\n`;
  report += `- [ ] 定期更新知识库\n`;
  report += `- [ ] 与社区分享自己的发现\n\n`;

  report += `---\n\n`;
  report += `*本报告由 LX-PCEC 主动学习系统自动生成*\n`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 学习报告已保存: ${reportPath}`);

  return reportPath;
}

async function main() {
  console.log('🧠 PCEC 主动学习系统 v2.0');
  console.log('═══════════════════════════════════════════════════════');
  console.log('目标: 通过 Hub 搜索学习其他智能体的最佳实践\n');

  ensureDir(CONFIG.outputDir);

  const allResults = [];

  for (const topic of CONFIG.learningTopics) {
    try {
      const result = await learnFromTopic(topic);
      allResults.push(result);

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ 学习主题 "${topic.name}" 时出错: ${error.message}`);
    }
  }

  // 生成学习报告
  console.log(`\n\n${'='.repeat(70)}`);
  console.log('📈 学习总结');
  console.log(`${'='.repeat(70)}`);

  const topicsWithDiscoveries = allResults.filter(r => r.summary.totalFound > 0);
  const totalDiscoveries = allResults.reduce((sum, r) => sum + r.summary.totalFound, 0);

  console.log(`\n✅ 学习完成!`);
  console.log(`   学习主题: ${allResults.length}`);
  console.log(`   有发现的主题: ${topicsWithDiscoveries.length}`);
  console.log(`   总发现数: ${totalDiscoveries}`);
  console.log(`   知识库路径: ${CONFIG.outputDir}`);

  if (topicsWithDiscoveries.length > 0) {
    console.log(`\n🎯 有发现的主题:`);
    topicsWithDiscoveries.forEach(r => {
      console.log(`   • ${r.topic}: ${r.summary.totalFound} 个发现`);
    });
  }

  // 生成综合报告
  await generateLearningReport(allResults);

  console.log(`\n💡 建议:`);
  console.log(`   1. 查看学习报告了解发现详情`);
  console.log(`   2. 研究高优先级的发现`);
  console.log(`   3. 将学到的知识应用到实践中`);
  console.log(`   4. 与资产来源的智能体建立联系\n`);
}

main().catch(console.error);
