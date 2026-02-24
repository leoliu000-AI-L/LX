#!/usr/bin/env node
/**
 * 深度学习系统 - 深入研究特定领域的高质量资产
 *
 * 策略:
 * 1. 聚焦特定信号组合，寻找相关资产
 * 2. 分析资产之间的关联性
 * 3. 提取架构模式和设计思想
 * 4. 生成可执行的改进方案
 */

const fs = require('fs');
const path = require('path');

// Set environment variables
process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';
process.env.EVOLVER_REUSE_MODE = 'reference';
process.env.EVOLVER_MIN_REUSE_SCORE = '0.72';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'deep-analysis'),
  // 深度学习领域 - 基于已发现的高质量资产
  deepDiveTopics: [
    {
      name: 'Lifecycle Watchdog 深度研究',
      baseAsset: 'sha256:3f57493702df5c7db38a75862c421fab8fc2330c11b84d3ba9a59ee6139485ea',
      signalSets: [
        ['watchdog', 'lifecycle', 'monitor'],
        ['health_check', 'recovery', 'auto'],
        ['process', 'supervisor', 'daemon'],
        ['heartbeat', 'aliveness', 'restart'],
      ],
      questions: [
        '如何实现细粒度的状态追踪?',
        '自动恢复机制的最佳实践是什么?',
        '如何处理级联故障?',
        '如何监控和记录失败模式?'
      ]
    },
    {
      name: 'OpenClaw 最佳实践',
      baseAsset: null, // 搜索所有 OpenClaw 相关
      signalSets: [
        ['openclaw', 'skill', 'integration'],
        ['openclaw', 'tool', 'automation'],
        ['openclaw', 'multi_agent', 'coordination'],
        ['openclaw', 'bridge', 'loop'],
      ],
      questions: [
        'OpenClaw 的核心架构是什么?',
        '如何设计和实现 skill?',
        'OpenClaw 的多智能体协作模式?',
        '如何与 OpenClaw bridge 集成?'
      ]
    },
    {
      name: '自动化循环系统',
      baseAsset: 'sha256:3f57493702df5c7db38a75862c421fab8fc2330c11b84d3ba9a59ee6139485ea',
      signalSets: [
        ['loop', 'evolve', 'continuous'],
        ['automation', 'scheduler', 'cron'],
        ['periodic', 'iteration', 'cycle'],
        ['auto_improve', 'self_evolve', 'adaptation'],
      ],
      questions: [
        '如何设计稳定的循环系统?',
        '如何避免循环中的状态累积?',
        '如何处理循环中断和恢复?',
        '如何实现自适应的循环间隔?'
      ]
    },
    {
      name: '知识管理最佳实践',
      baseAsset: 'sha256:f42f2f09fb34774c58fca70a835671bf8f688b159a1859187a709036a1022a40',
      signalSets: [
        ['knowledge', 'semantic', 'embed'],
        ['rag', 'retrieval', 'vector'],
        ['memory', 'context', 'history'],
        ['index', 'search', 'query'],
      ],
      questions: [
        '如何构建高效的语义索引?',
        'RAG 系统的最佳架构?',
        '如何处理知识的时效性?',
        '如何实现增量学习?'
      ]
    }
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveDeepAnalysis(topic, analysis) {
  const topicDir = path.join(CONFIG.outputDir, topic.slug);
  ensureDir(topicDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_deep_analysis.json`;
  const filepath = path.join(topicDir, filename);

  fs.writeFileSync(filepath, JSON.stringify({
    timestamp: new Date().toISOString(),
    topic: topic.name,
    analysis
  }, null, 2));

  return filepath;
}

function generateRecommendation(analysis) {
  const recommendations = [];

  // 基于发现的资产数量
  if (analysis.totalAssets > 5) {
    recommendations.push(`发现了 ${analysis.totalAssets} 个相关资产，说明这是一个成熟的技术领域`);
    recommendations.push(`可以综合多个资产的优点，创建更完善的解决方案`);
  } else if (analysis.totalAssets > 0) {
    recommendations.push(`发现 ${analysis.totalAssets} 个相关资产，可以深入研究其实现`);
  } else {
    recommendations.push(`该领域可能还有创新空间，可以考虑填补空白`);
  }

  // 基于评分
  if (analysis.bestScore > 8) {
    recommendations.push(`有评分超过 8.0 的顶级资产，应该重点学习其架构`);
  } else if (analysis.bestScore > 5) {
    recommendations.push(`有高质量资产可以借鉴`);
  }

  // 基于来源节点
  if (analysis.sourceNodes.size > 3) {
    recommendations.push(`来自 ${analysis.sourceNodes.size} 个不同节点，说明有多种实现方法`);
  }

  // 基于成功记录
  if (analysis.maxStreak >= 20) {
    recommendations.push(`有 ${analysis.maxStreak} 次稳定成功记录，说明该方案经过充分验证`);
  } else if (analysis.maxStreak >= 10) {
    recommendations.push(`成功记录良好，可以考虑采用`);
  }

  return recommendations;
}

async function deepDiveTopic(topic) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔬 深度研究: ${topic.name}`);
  console.log(`${'='.repeat(80)}`);

  const slug = topic.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const analysis = {
    slug,
    topicName: topic.name,
    signalSets: [],
    assets: [],
    patterns: new Map(),
    sourceNodes: new Map(),
    totalAssets: 0,
    bestScore: 0,
    maxStreak: 0,
    recommendations: []
  };

  // 研究每个信号组合
  for (let i = 0; i < topic.signalSets.length; i++) {
    const signals = topic.signalSets[i];
    console.log(`\n📡 信号集 ${i + 1}/${topic.signalSets.length}: ${signals.join(', ')}`);

    const searchResult = await hubSearch(signals, {
      threshold: 0.65,
      limit: 10,
      timeoutMs: 15000,
    });

    const signalSetAnalysis = {
      signals,
      hit: searchResult.hit,
      reason: searchResult.reason || 'success',
      assets: []
    };

    if (searchResult.hit) {
      console.log(`✅ 找到匹配!`);
      console.log(`   Asset ID: ${searchResult.asset_id}`);
      console.log(`   来源节点: ${searchResult.source_node_id}`);
      console.log(`   评分: ${searchResult.score.toFixed(3)}`);
      console.log(`   模式: ${searchResult.mode}`);

      signalSetAnalysis.assets.push({
        asset_id: searchResult.asset_id,
        source_node_id: searchResult.source_node_id,
        score: searchResult.score,
        confidence: searchResult.match?.confidence,
        success_streak: searchResult.match?.success_streak,
        category: searchResult.match?.category,
        signals_match: searchResult.match?.signals_match,
        local_id: searchResult.match?.local_id
      });

      // 更新统计
      analysis.totalAssets++;
      analysis.bestScore = Math.max(analysis.bestScore, searchResult.score);

      const streak = searchResult.match?.success_streak || 0;
      analysis.maxStreak = Math.max(analysis.maxStreak, streak);

      // 记录来源节点
      const nodeId = searchResult.source_node_id || 'unknown';
      analysis.sourceNodes.set(nodeId, (analysis.sourceNodes.get(nodeId) || 0) + 1);

      // 分析模式
      const signalsMatch = searchResult.match?.signals_match || [];
      signalsMatch.forEach(signal => {
        analysis.patterns.set(signal, (analysis.patterns.get(signal) || 0) + 1);
      });

    } else {
      console.log(`⚠️  未找到匹配`);
      console.log(`   原因: ${searchResult.reason}`);
    }

    analysis.signalSets.push(signalSetAnalysis);

    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // 生成建议
  analysis.recommendations = generateRecommendation(analysis);

  // 保存分析
  const filepath = saveDeepAnalysis({ slug, name: topic.name }, analysis);
  console.log(`\n💾 深度分析已保存: ${filepath}`);

  return analysis;
}

function generateDeepLearningReport(allAnalyses) {
  const reportPath = path.join(CONFIG.outputDir, 'deep-learning-report.md');

  let report = `# 🔬 深度学习报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n`;
  report += `**学习系统**: LX-PCEC v7.0\n`;
  report += `**研究主题数**: ${allAnalyses.length}\n\n`;
  report += `---\n\n`;

  // 总览
  report += `## 📊 深度学习总览\n\n`;

  let totalAssets = 0;
  let bestTopics = [];

  allAnalyses.forEach(analysis => {
    totalAssets += analysis.totalAssets;
    if (analysis.totalAssets > 0) {
      bestTopics.push({
        name: analysis.topicName,
        assets: analysis.totalAssets,
        bestScore: analysis.bestScore,
        maxStreak: analysis.maxStreak
      });
    }
  });

  report += `- **研究主题数**: ${allAnalyses.length}\n`;
  report += `- **发现资产总数**: ${totalAssets}\n`;
  report += `- **有发现的主题**: ${bestTopics.length}\n\n`;

  if (bestTopics.length > 0) {
    report += `### 🏆 最有价值的主题\n\n`;
    bestTopics
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 5)
      .forEach((topic, i) => {
        report += `${i + 1}. **${topic.name}**\n`;
        report += `   - 资产数: ${topic.assets}\n`;
        report += `   - 最高评分: ${topic.bestScore.toFixed(2)}\n`;
        report += `   - 最大成功记录: ${topic.maxStreak} 次\n\n`;
      });
  }

  // 详细分析
  report += `## 📋 详细深度分析\n\n`;

  allAnalyses.forEach(analysis => {
    report += `### ${analysis.topicName}\n\n`;

    if (analysis.totalAssets === 0) {
      report += `⚠️ 未发现相关资产\n\n`;
      return;
    }

    report += `**发现资产数**: ${analysis.totalAssets}\n`;
    report += `**最高评分**: ${analysis.bestScore.toFixed(2)}\n`;
    report += `**最大成功记录**: ${analysis.maxStreak} 次\n\n`;

    // 信号集分析
    report += `#### 信号集分析\n\n`;
    analysis.signalSets.forEach((ss, i) => {
      report += `${i + 1}. 信号: \`${ss.signals.join('`, `')}\`\n`;

      if (ss.hit && ss.assets.length > 0) {
        ss.assets.forEach(asset => {
          report += `   - [${asset.asset_id?.substring(0, 20)}...] 来自 ${asset.source_node_id}\n`;
          report += `     评分: ${asset.score.toFixed(2)}, 置信度: ${asset.confidence}, 成功: ${asset.success_streak} 次\n`;
        });
      } else {
        report += `   未找到匹配 (${ss.reason})\n`;
      }
      report += `\n`;
    });

    // 模式分析
    if (analysis.patterns.size > 0) {
      report += `#### 识别的模式\n\n`;
      const sortedPatterns = Array.from(analysis.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      sortedPatterns.forEach(([pattern, count]) => {
        report += `- \`${pattern}\`: ${count} 次\n`;
      });
      report += `\n`;
    }

    // 来源节点
    if (analysis.sourceNodes.size > 0) {
      report += `#### 来源节点\n\n`;
      const sortedNodes = Array.from(analysis.sourceNodes.entries())
        .sort((a, b) => b[1] - a[1]);

      sortedNodes.forEach(([nodeId, count]) => {
        report += `- ${nodeId}: ${count} 个资产\n`;
      });
      report += `\n`;
    }

    // 建议
    if (analysis.recommendations.length > 0) {
      report += `#### 💡 建议\n\n`;
      analysis.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
      report += `\n`;
    }
  });

  // 行动计划
  report += `## 🎯 行动计划\n\n`;

  report += `### 优先级排序\n\n`;
  const prioritized = bestTopics
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 3);

  prioritized.forEach((topic, i) => {
    report += `${i + 1}. **${topic.name}** (优先级: ${i === 0 ? '🔥 高' : i === 1 ? '⚡ 中' : '📈 低'})\n`;
    report += `   - 立即行动: 研究该领域的最佳实践\n`;
    report += `   - 短期目标: 整合到 PCEC 系统\n`;
    report += `   - 长期目标: 创建改进版本\n\n`;
  });

  report += `### 实施步骤\n\n`;
  report += `1. **研究阶段** (1-2周)\n`;
  report += `   - 深入研究高分资产的实现细节\n`;
  report += `   - 分析架构设计和模式\n`;
  report += `   - 理解成功的关键因素\n\n`;

  report += `2. **设计阶段** (1周)\n`;
  report += `   - 基于 PCEC 当前状态设计改进方案\n`;
  report += `   - 确保向后兼容\n`;
  report += `   - 制定实施计划\n\n`;

  report += `3. **实施阶段** (2-3周)\n`;
  report += `   - 逐步实现改进\n`;
  report += `   - 充分测试\n`;
  report += `   - 文档和发布\n\n`;

  report += `4. **分享阶段** (持续)\n`;
  report += `   - 发布改进的资产\n`;
  report += `   - 与原作者交流\n`;
  report += `   - 贡献回社区\n\n`;

  report += `---\n\n`;
  report += `*本报告由 LX-PCEC 深度学习系统自动生成*\n`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 深度学习报告已保存: ${reportPath}`);

  return reportPath;
}

async function main() {
  console.log('🔬 PCEC 深度学习系统 v1.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('目标: 深入研究特定领域的高质量资产，提取架构模式和设计思想\n');

  ensureDir(CONFIG.outputDir);

  const allAnalyses = [];

  for (const topic of CONFIG.deepDiveTopics) {
    try {
      const analysis = await deepDiveTopic(topic);
      allAnalyses.push(analysis);

      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ 深度研究 "${topic.name}" 时出错: ${error.message}`);
    }
  }

  // 生成综合报告
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📈 深度学习总结');
  console.log(`${'='.repeat(80)}`);

  const topicsWithFindings = allAnalyses.filter(a => a.totalAssets > 0);
  const totalDiscoveries = allAnalyses.reduce((sum, a) => sum + a.totalAssets, 0);

  console.log(`\n✅ 深度学习完成!`);
  console.log(`   研究主题: ${allAnalyses.length}`);
  console.log(`   有发现的主题: ${topicsWithFindings.length}`);
  console.log(`   总发现数: ${totalDiscoveries}`);
  console.log(`   分析库路径: ${CONFIG.outputDir}`);

  if (topicsWithFindings.length > 0) {
    console.log(`\n🏆 最有价值的发现:`);
    topicsWithFindings
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 3)
      .forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.topicName}: ${t.totalAssets} 个资产, 最高评分 ${t.bestScore.toFixed(2)}`);
      });
  }

  // 生成综合报告
  await generateDeepLearningReport(allAnalyses);

  console.log(`\n💡 下一步:`);
  console.log(`   1. 查看深度学习报告了解详细分析`);
  console.log(`   2. 优先研究高分资产`);
  console.log(`   3. 设计改进方案`);
  console.log(`   4. 实施并分享\n`);
}

main().catch(console.error);
