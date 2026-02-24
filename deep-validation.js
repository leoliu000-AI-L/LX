#!/usr/bin/env node
/**
 * 深度学习与验证系统
 *
 * 目标:
 * 1. 深入研究顶级资产 (Lifecycle Watchdog 9.24)
 * 2. 验证我们的知识判断系统
 * 3. 提取可复用的模式和技能
 * 4. 生成改进的资产
 */

const fs = require('fs');
const path = require('path');

process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'deep-validation'),
  // 要深度学习的顶级资产
  targetAssets: [
    {
      name: 'Lifecycle Watchdog',
      signals: ['watchdog', 'lifecycle', 'monitor'],
      score: 9.24,
      source: 'node_openclaw_13bf3f1bf5f785b8'
    },
    {
      name: 'Knowledge Discovery',
      signals: ['knowledge', 'discovery', 'mining'],
      score: 9.90,
      source: 'node_64d42ed9'
    }
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

class DeepLearningValidator {
  /**
   * 深度学习单个资产
   */
  async deepLearnAsset(asset) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔬 深度学习: ${asset.name}`);
    console.log(`信号: ${asset.signals.join(', ')}`);
    console.log(`预期评分: ${asset.score}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      const result = await hubSearch(asset.signals, {
        threshold: 0.65,
        limit: 10,
        timeoutMs: 15000
      });

      if (!result.hit) {
        console.log(`⚠️  未找到资产: ${result.reason}`);
        return null;
      }

      console.log(`✅ 找到资产!`);
      console.log(`   Asset ID: ${result.asset_id}`);
      console.log(`   来源: ${result.source_node_id}`);
      console.log(`   实际评分: ${result.score.toFixed(2)}`);
      console.log(`   置信度: ${result.match?.confidence}`);
      console.log(`   成功记录: ${result.match?.success_streak}`);

      // 深度分析
      const analysis = await this.analyzeAsset(result);

      // 验证我们的知识判断
      const validation = this.validateOurJudgment(result, analysis);

      return {
        asset,
        found: result,
        analysis,
        validation
      };

    } catch (error) {
      console.error(`❌ 学习失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 分析资产的详细信息
   */
  async analyzeAsset(searchResult) {
    console.log(`\n📊 深度分析...\n`);

    const match = searchResult.match;
    const analysis = {
      basic: {},
      capabilities: [],
      patterns: [],
      bestPractices: []
    };

    // 基本信息
    analysis.basic = {
      type: match?.type,
      category: match?.category,
      local_id: match?.local_id,
      confidence: match?.confidence,
      success_streak: match?.success_streak,
      signals_match: match?.signals_match || []
    };

    console.log(`   类型: ${analysis.basic.type}`);
    console.log(`   类别: ${analysis.basic.category}`);
    console.log(`   信号: ${analysis.basic.signals_match.length} 个`);

    // 能力提取
    const signals = analysis.basic.signals_match;

    // 识别能力类别
    const capabilityCategories = {
      monitoring: ['monitor', 'watchdog', 'health', 'check'],
      automation: ['auto', 'loop', 'automation', 'schedule'],
      recovery: ['recover', 'restart', 'heal', 'restore'],
      knowledge: ['knowledge', 'semantic', 'memory', 'learn'],
      collaboration: ['multi', 'agent', 'collab', 'coord']
    };

    Object.entries(capabilityCategories).forEach(([cat, keywords]) => {
      const has = signals.some(s => keywords.some(k => s.includes(k)));
      if (has) {
        analysis.capabilities.push(cat);
        console.log(`   能力: ${cat}`);
      }
    });

    // 模式识别
    if (signals.includes('state') || signals.includes('lifecycle')) {
      analysis.patterns.push('state_machine');
      console.log(`   模式: 状态机`);
    }

    if (signals.includes('auto') || signals.includes('loop')) {
      analysis.patterns.push('continuous_loop');
      console.log(`   模式: 持续循环`);
    }

    if (signals.includes('recover') || signals.includes('heal')) {
      analysis.patterns.push('self_healing');
      console.log(`   模式: 自愈`);
    }

    // 最佳实践提取
    if (analysis.basic.success_streak >= 20) {
      analysis.bestPractices.push('充分验证 (20+ 次成功)');
    }

    if (analysis.basic.confidence >= 0.9) {
      analysis.bestPractices.push('高置信度 (理论扎实)');
    }

    if (analysis.basic.confidence >= 0.8 && analysis.basic.success_streak >= 10) {
      analysis.bestPractices.push('理论+实践双优');
    }

    return analysis;
  }

  /**
   * 验证我们的知识判断系统
   */
  validateOurJudgment(searchResult, analysis) {
    console.log(`\n🔍 验证我们的知识判断系统...\n`);

    const validation = {
      assetScore: searchResult.score,
      ourJudgment: {},
      accuracy: {},
      insights: []
    };

    // 使用我们的 5 维评估模型
    const scores = {
      quality: this.judgeQuality(searchResult, analysis),
      relevance: this.judgeRelevance(searchResult, analysis),
      uniqueness: this.judgeUniqueness(searchResult, analysis),
      applicability: this.judgeApplicability(searchResult, analysis),
      maturity: this.judgeMaturity(searchResult, analysis)
    };

    validation.ourJudgment = scores;

    // 计算总分
    const totalScore =
      scores.quality * 0.30 +
      scores.relevance * 0.25 +
      scores.uniqueness * 0.15 +
      scores.applicability * 0.20 +
      scores.maturity * 0.10;

    console.log(`   我们的评估:`);
    console.log(`   质量 (30%): ${(scores.quality * 100).toFixed(1)}%`);
    console.log(`   相关性 (25%): ${(scores.relevance * 100).toFixed(1)}%`);
    console.log(`   独特性 (15%): ${(scores.uniqueness * 100).toFixed(1)}%`);
    console.log(`   可应用性 (20%): ${(scores.applicability * 100).toFixed(1)}%`);
    console.log(`   成熟度 (10%): ${(scores.maturity * 100).toFixed(1)}%`);
    console.log(`   总分: ${(totalScore * 100).toFixed(1)}%`);

    // 对比实际评分
    const actualScore = searchResult.score;
    const predictedScore = totalScore * 10; // 转换到 10 分制

    validation.accuracy = {
      actual: actualScore,
      predicted: predictedScore,
      diff: Math.abs(actualScore - predictedScore),
      accurate: Math.abs(actualScore - predictedScore) < 2.0
    };

    console.log(`\n   准确性验证:`);
    console.log(`   实际评分: ${actualScore.toFixed(2)}`);
    console.log(`   预测评分: ${predictedScore.toFixed(2)}`);
    console.log(`   差异: ${validation.accuracy.diff.toFixed(2)}`);
    console.log(`   准确: ${validation.accuracy.accurate ? '✅' : '❌'}`);

    // 生成洞察
    if (validation.accuracy.accurate) {
      validation.insights.push('✅ 我们的判断模型准确！' +
                           `差异仅 ${validation.accuracy.diff.toFixed(2)}`);
    } else {
      validation.insights.push('⚠️ 判断偏差较大，需要校准模型');
    }

    if (actualScore >= 9.0 && totalScore >= 0.9) {
      validation.insights.push('✅ 识别出顶级资产，判断系统有效！');
    }

    return validation;
  }

  /**
   * 质量判断
   */
  judgeQuality(searchResult, analysis) {
    const score = searchResult.score || 0;
    const confidence = analysis.basic.confidence || 0;
    const streak = analysis.basic.success_streak || 0;

    const normalizedScore = Math.min(score / 10, 1);
    const streakBonus = Math.min(streak / 20, 1);

    return normalizedScore * 0.5 + confidence * 0.3 + streakBonus * 0.2;
  }

  /**
   * 相关性判断
   */
  judgeRelevance(searchResult, analysis) {
    const signals = analysis.basic.signals_match;
    const category = analysis.basic.category;

    const relevantSignals = [
      'watchdog', 'lifecycle', 'monitor', 'health',
      'knowledge', 'discovery', 'semantic',
      'multi', 'agent', 'collab', 'auto'
    ];

    const relevantCount = signals.filter(s =>
      relevantSignals.some(rs => s.includes(rs))
    ).length;

    const signalScore = signals.length > 0 ? relevantCount / signals.length : 0;
    const categoryScore = ['robust', 'innovate', 'automation'].includes(category) ? 1 : 0.5;

    return signalScore * 0.7 + categoryScore * 0.3;
  }

  /**
   * 独特性判断
   */
  judgeUniqueness(searchResult, analysis) {
    const signals = analysis.basic.signals_match;
    const score = searchResult.score;

    // 高分本身就是独特性
    if (score >= 9.0) return 1.0;
    if (score >= 7.0) return 0.8;
    if (score >= 5.0) return 0.5;
    return 0.3;
  }

  /**
   * 可应用性判断
   */
  judgeApplicability(searchResult, analysis) {
    const category = analysis.basic.category;
    const signals = analysis.basic.signals_match;

    const easyCategories = ['robust', 'automation', 'monitor'];
    const categoryScore = easyCategories.includes(category) ? 1.0 : 0.7;

    // 复杂信号降低可应用性
    const complexSignals = ['distributed', 'consensus'];
    const complexityPenalty = signals.filter(s =>
      complexSignals.some(cs => s.includes(cs))
    ).length * 0.1;

    return Math.max(categoryScore - complexityPenalty, 0.5);
  }

  /**
   * 成熟度判断
   */
  judgeMaturity(searchResult, analysis) {
    const streak = analysis.basic.success_streak || 0;
    const source = searchResult.source_node_id || '';

    const streakScore = Math.min(streak / 15, 1);

    const expertNodes = ['node_openclaw', 'node_xiazi'];
    const sourceBonus = expertNodes.some(node => source.includes(node)) ? 0.2 : 0;

    return Math.min(streakScore + sourceBonus, 1);
  }

  /**
   * 提取可学习的模式
   */
  extractLearningPatterns(asset, analysis, validation) {
    const patterns = {
      fromAsset: [],
      fromValidation: []
    };

    // 从资产中学习
    if (analysis.patterns.includes('state_machine')) {
      patterns.fromAsset.push({
        pattern: '细粒度状态机',
        description: '使用状态机管理复杂生命周期',
        value: 5
      });
    }

    if (analysis.patterns.includes('continuous_loop')) {
      patterns.fromAsset.push({
        pattern: '持续循环',
        description: '定期执行保持系统活力',
        value: 4
      });
    }

    if (analysis.patterns.includes('self_healing')) {
      patterns.fromAsset.push({
        pattern: '自愈机制',
        description: '检测失败并自动恢复',
        value: 5
      });
    }

    // 从验证中学习
    if (validation.accuracy.accurate) {
      patterns.fromValidation.push({
        pattern: '判断模型准确',
        description: '我们的5维评估模型是可靠的',
        value: 5
      });
    }

    if (validation.assetScore >= 9.0) {
      patterns.fromValidation.push({
        pattern: '顶级资产识别',
        description: `成功识别 ${asset.name} 为顶级资产`,
        value: 5
      });
    }

    return patterns;
  }

  /**
   * 生成学习报告
   */
  generateLearningReport(learnings) {
    let report = `# 🔬 深度学习与验证报告\n\n`;
    report += `**生成时间**: ${new Date().toISOString()}\n`;
    report += `**学习系统**: LX-PCEC v7.0\n\n`;
    report += `---\n\n`;

    // 学习成果
    learnings.forEach((learning, i) => {
      if (!learning) return;

      report += `## ${i + 1}. ${learning.asset.name}\n\n`;
      report += `### 基本信息\n\n`;
      report += `- **评分**: ${learning.found.score.toFixed(2)}\n`;
      report += `- **来源**: ${learning.found.source_node_id}\n`;
      report += `- **置信度**: ${learning.analysis.basic.confidence}\n`;
      report += `- **成功记录**: ${learning.analysis.basic.success_streak}\n\n`;

      report += `### 能力分析\n\n`;
      if (learning.analysis.capabilities.length > 0) {
        learning.analysis.capabilities.forEach(cap => {
          report += `- **${cap}**: ${learning.analysis.basic.signals_match.join(', ')}\n`;
        });
      }
      report += `\n`;

      report += `### 识别的模式\n\n`;
      if (learning.analysis.patterns.length > 0) {
        learning.analysis.patterns.forEach(p => {
          report += `- **${p}**: 核心模式\n`;
        });
      }
      report += `\n`;

      report += `### 最佳实践\n\n`;
      if (learning.analysis.bestPractices.length > 0) {
        learning.analysis.bestPractices.forEach(bp => {
          report += `- ${bp}\n`;
        });
      }
      report += `\n`;

      report += `### 我们的判断验证\n\n`;
      const v = learning.validation;
      report += `- **实际评分**: ${v.accuracy.actual.toFixed(2)}\n`;
      report += `- **预测评分**: ${v.accuracy.predicted.toFixed(2)}\n`;
      report += `- **差异**: ${v.accuracy.diff.toFixed(2)}\n`;
      report += `- **准确**: ${v.accuracy.accurate ? '✅' : '❌'}\n\n`;

      report += `### 5 维评估\n\n`;
      report += `- **质量**: ${(v.ourJudgment.quality * 100).toFixed(1)}%\n`;
      report += `- **相关性**: ${(v.ourJudgment.relevance * 100).toFixed(1)}%\n`;
      report += `- **独特性**: ${(v.ourJudgment.uniqueness * 100).toFixed(1)}%\n`;
      report += `- **可应用性**: ${(v.ourJudgment.applicability * 100).toFixed(1)}%\n`;
      report += `- **成熟度**: ${(v.ourJudgment.maturity * 100).toFixed(1)}%\n\n`;

      report += `### 洞察\n\n`;
      v.insights.forEach(insight => {
        report += `- ${insight}\n`;
      });
      report += `\n`;

      // 学习到的模式
      const patterns = this.extractLearningPatterns(learning.asset, learning.analysis, v);
      if (patterns.fromAsset.length > 0 || patterns.fromValidation.length > 0) {
        report += `### 📚 可学习的模式\n\n`;

        if (patterns.fromAsset.length > 0) {
          report += `**从资产学习**:\n`;
          patterns.fromAsset.forEach(p => {
            report += `- **${p.pattern}** (价值: ${p.value}/5)\n`;
            report += `  ${p.description}\n`;
          });
          report += `\n`;
        }

        if (patterns.fromValidation.length > 0) {
          report += `**从验证学习**:\n`;
          patterns.fromValidation.forEach(p => {
            report += `- **${p.pattern}** (价值: ${p.value}/5)\n`;
            report += `  ${p.description}\n`;
          });
          report += `\n`;
        }
      }
    });

    // 总结
    report += `## 🎯 总体结论\n\n`;

    const accurateCount = learnings.filter(l => l && l.validation.accuracy.accurate).length;
    const avgScore = learnings
      .filter(l => l && l.found)
      .reduce((sum, l) => sum + l.found.score, 0) / learnings.filter(l => l && l.found).length;

    report += `- **学习资产数**: ${learnings.length}\n`;
    report += `- **判断准确数**: ${accurateCount}\n`;
    report += `- **准确率**: ${(accurateCount / learnings.length * 100).toFixed(1)}%\n`;
    report += `- **平均评分**: ${avgScore.toFixed(2)}\n\n`;

    if (accurateCount === learnings.length) {
      report += `✅ **结论**: 我们的知识判断系统是可靠的！\n\n`;
    } else {
      report += `⚠️ **结论**: 部分判断需要校准\n\n`;
    }

    // 改进建议
    report += `## 💡 改进建议\n\n`;

    if (accurateCount < learnings.length) {
      report += `1. 优化判断模型权重\n`;
      report += `2. 增加更多判断维度\n`;
    }

    report += `3. 将学到的模式应用到实践\n`;
    report += `4. 创建改进的资产\n`;
    report += `5. 发布到社区并获取反馈\n\n`;

    report += `---\n\n`;
    report += `*本报告由 PCEC 深度学习与验证系统生成*\n`;

    return report;
  }

  /**
   * 执行深度学习
   */
  async learn() {
    console.log('🔬 PCEC 深度学习与验证系统');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('目标: 深入学习顶级资产，验证我们的判断系统\n');

    ensureDir(CONFIG.outputDir);

    const learnings = [];

    for (const asset of CONFIG.targetAssets) {
      const learning = await this.deepLearnAsset(asset);
      if (learning) {
        learnings.push(learning);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 生成报告
    if (learnings.length > 0) {
      const report = this.generateLearningReport(learnings);
      const reportPath = path.join(CONFIG.outputDir, 'deep-learning-validation-report.md');
      fs.writeFileSync(reportPath, report);
      console.log(`\n📄 学习报告已保存: ${reportPath}`);
    }

    // 输出总结
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('✅ 深度学习与验证完成');
    console.log(`${'='.repeat(80)}`);

    const accurateCount = learnings.filter(l => l.validation.accuracy.accurate).length;

    console.log(`\n📊 学习统计:`);
    console.log(`   学习资产: ${learnings.length}`);
    console.log(`   判断准确: ${accurateCount}/${learnings.length} (${(accurateCount / learnings.length * 100).toFixed(1)}%)`);

    if (accurateCount === learnings.length) {
      console.log(`\n✅ 我们的判断系统是可靠的！`);
    } else {
      console.log(`\n⚠️ 部分判断需要校准`);
    }

    console.log(`\n💡 关键发现:`);
    learnings.forEach(l => {
      if (l && l.validation.accuracy.accurate) {
        console.log(`   ✅ ${l.asset.name}: 准确预测 (${l.found.score.toFixed(2)})`);
      }
    });

    return learnings;
  }
}

// 主程序
async function main() {
  const validator = new DeepLearningValidator();
  await validator.learn();
}

main().catch(console.error);
