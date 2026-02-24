#!/usr/bin/env node
/**
 * 自动进化系统 - 每小时挖掘知识并发布总结
 *
 * 渠道:
 * 1. EvoMap Hub - API
 * 2. GitHub - 通过已有的 Evolver 资产
 * 3. 自身代码库 - Git 历史
 * 4. 知识库 - 本地知识
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'auto-evolution'),
  summaryDir: path.join(__dirname, 'evolution-summaries'),
  interval: 3600000, // 1 小时
  knowledgeSignals: [
    ['agent', 'automation'],
    ['knowledge', 'management'],
    ['monitor', 'watchdog'],
    ['multi', 'agent', 'collab'],
    ['semantic', 'search'],
    ['evolution', 'learning']
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

class AutoEvolutionSystem {
  constructor() {
    this.discoveries = [];
    this.knowledgeBase = [];
    this.lastEvolution = null;
  }

  /**
   * 从 EvoMap 挖掘知识
   */
  async mineFromHub() {
    console.log(`\n🔍 从 EvoMap Hub 挖掘...`);

    const discoveries = [];

    for (const signals of CONFIG.knowledgeSignals) {
      try {
        const result = await hubSearch(signals, {
          threshold: 0.65,
          limit: 5,
          timeoutMs: 10000
        });

        if (result.hit) {
          discoveries.push({
            channel: 'evomap',
            asset_id: result.asset_id,
            source: result.source_node_id,
            score: result.score,
            match: result.match,
            timestamp: new Date().toISOString()
          });
          console.log(`   ✅ ${result.asset_id?.substring(0, 20)}... (${result.score.toFixed(2)})`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return discoveries;
  }

  /**
   * 从本地代码库挖掘知识
   */
  async mineFromLocalCode() {
    console.log(`\n📂 从本地代码库挖掘...`);

    try {
      // 获取最近的 Git 提交
      const cmd = 'git log --since="1 hour ago" --oneline';
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 5000 });

      const commits = output.trim().split('\n').filter(line => line);
      console.log(`   最近 1 小时提交: ${commits.length}`);

      return commits.map(commit => ({
        channel: 'local',
        type: 'commit',
        message: commit,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.log(`   ⚠️  ${error.message}`);
      return [];
    }
  }

  /**
   * 分析知识库中的模式
   */
  async analyzeKnowledgePatterns() {
    console.log(`\n🧠 分析知识模式...`);

    const patterns = [];

    // 统计资产类型
    const assetTypes = {};
    this.discoveries.forEach(d => {
      if (d.match?.type) {
        assetTypes[d.match.type] = (assetTypes[d.match.type] || 0) + 1;
      }
    });

    if (Object.keys(assetTypes).length > 0) {
      patterns.push({
        type: 'asset_distribution',
        data: assetTypes
      });
    }

    // 统计评分分布
    const scores = this.discoveries
      .filter(d => d.score)
      .map(d => d.score);

    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      patterns.push({
        type: 'score_distribution',
        average: avgScore.toFixed(2),
        count: scores.length
      });
    }

    console.log(`   发现模式: ${patterns.length}`);
    patterns.forEach(p => {
      console.log(`   - ${p.type}`);
    });

    return patterns;
  }

  /**
   * 整合知识
   */
  async integrateKnowledge(newDiscoveries) {
    console.log(`\n🔄 整合知识...`);

    // 去重
    const existingIds = new Set(this.discoveries.map(d => d.asset_id));
    const newUnique = newDiscoveries.filter(d => !existingIds.has(d.asset_id));

    console.log(`   新发现: ${newDiscoveries.length}`);
    console.log(`   新增: ${newUnique.length}`);

    this.discoveries.push(...newUnique);

    // 更新知识库
    this.knowledgeBase = this.discoveries.map(d => ({
      id: d.asset_id,
      channel: d.channel,
      quality: d.score,
      timestamp: d.timestamp
    }));

    return newUnique.length;
  }

  /**
   * 生成进化洞察
   */
  async generateInsights() {
    console.log(`\n💡 生成进化洞察...`);

    const insights = [];

    // 洞察 1: 发现趋势
    if (this.discoveries.length >= 5) {
      insights.push({
        type: 'discovery_trend',
        message: `已累计发现 ${this.discoveries.length} 个知识资产`,
        suggestion: '继续保持主动学习'
      });
    }

    // 洞察 2: 质量趋势
    const recentScores = this.discoveries
      .slice(-10)
      .filter(d => d.score)
      .map(d => d.score);

    if (recentScores.length >= 5) {
      const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      insights.push({
        type: 'quality_trend',
        message: `最近平均评分: ${avgRecent.toFixed(2)}`,
        suggestion: avgRecent >= 7.0 ? '质量优秀' : '需要提高筛选标准'
      });
    }

    // 洞察 3: 进化速度
    if (this.lastEvolution) {
      const timeSinceLast = Date.now() - this.lastEvolution;
      insights.push({
        type: 'evolution_pace',
        message: `距离上次进化: ${Math.round(timeSinceLast / 60000)} 分钟`,
        suggestion: '保持稳定的进化节奏'
      });
    }

    this.lastEvolution = Date.now();

    console.log(`   生成洞察: ${insights.length}`);

    return insights;
  }

  /**
   * 生成每小时进化总结
   */
  async generateHourlySummary() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const hour = now.getHours();

    let summary = `# ⏰ 每小时进化总结\n\n`;
    summary += `**时间**: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
    summary += `**第 ${hour} 点**\n`;
    summary += `**节点**: node_514d17ec9eaa04a4 (LX-PCEC v7.0)\n\n`;
    summary += `---\n\n`;

    // 1. 本小时挖掘统计
    summary += `## 📊 本小时挖掘统计\n\n`;

    const channelCounts = {};
    this.discoveries.slice(-50).forEach(d => {
      channelCounts[d.channel] = (channelCounts[d.channel] || 0) + 1;
    });

    summary += `### 按渠道分布\n\n`;
    Object.entries(channelCounts).forEach(([channel, count]) => {
      summary += `- **${channel}**: ${count}\n`;
    });
    summary += `\n`;

    const totalRecent = this.discoveries.slice(-50).length;
    summary += `**总计**: ${totalRecent}\n\n`;

    // 2. 顶级发现
    if (this.discoveries.length > 0) {
      summary += `## 🏆 顶级发现\n\n`;

      const topOnes = this.discoveries
        .filter(d => d.score)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      topOnes.forEach((d, i) => {
        summary += `### ${i + 1}. ${d.asset_id?.substring(0, 30)}...\n\n`;
        summary += `- **评分**: ${d.score.toFixed(2)}\n`;
        summary += `- **来源**: ${d.source}\n`;
        summary += `- **渠道**: ${d.channel}\n\n`;
      });
    }

    // 3. 进化洞察
    const insights = await this.generateInsights();

    if (insights.length > 0) {
      summary += `## 💡 进化洞察\n\n`;

      insights.forEach((insight, i) => {
        const icon = insight.type === 'discovery_trend' ? '📈' :
                     insight.type === 'quality_trend' ? '⭐' : '⏰';
        summary += `### ${icon} ${insight.message}\n\n`;
        if (insight.suggestion) {
          summary += `**建议**: ${insight.suggestion}\n\n`;
        }
      });
    }

    // 4. 知识统计
    summary += `## 📚 知识库统计\n\n`;

    const qualityLevels = {
      excellent: this.discoveries.filter(d => d.score >= 9.0).length,
      good: this.discoveries.filter(d => d.score >= 7.0 && d.score < 9.0).length,
      average: this.discoveries.filter(d => d.score >= 5.0 && d.score < 7.0).length,
      low: this.discoveries.filter(d => d.score < 5.0).length
    };

    summary += `### 质量分布\n\n`;
    summary += `- ⭐⭐⭐⭐⭐ 优秀 (≥9.0): ${qualityLevels.excellent}\n`;
    summary += `- ⭐⭐⭐⭐ 良好 (7.0-9.0): ${qualityLevels.good}\n`;
    summary += `- ⭐⭐⭐ 一般 (5.0-7.0): ${qualityLevels.average}\n`;
    summary += `- ⭐⭐ 较低 (<5.0): ${qualityLevels.low}\n\n`;

    // 5. 下小时计划
    summary += `## 🎯 下小时计划\n\n`;
    summary += `1. 继续从 EvoMap Hub 挖掘知识\n`;
    summary += `2. 分析新发现的资产\n`;
    summary += `3. 整合到知识库\n`;
    summary += `4. 更新知识判断模型\n`;
    summary += `5. 发布新的进化总结\n\n`;

    summary += `---\n\n`;
    summary += `*由 LX-PCEC 自动进化系统生成*\n`;
    summary += `*下一份总结将在 1 小时后 (${hour + 1} 点) 发布*\n`;

    // 保存
    ensureDir(CONFIG.summaryDir);
    const filename = `hourly-evolution-${timestamp}.md`;
    const filepath = path.join(CONFIG.summaryDir, filename);
    fs.writeFileSync(filepath, summary);

    // 保存最新版本
    const latestPath = path.join(CONFIG.summaryDir, 'latest-hourly-evolution.md');
    fs.writeFileSync(latestPath, summary);

    console.log(`\n📄 进化总结已保存:`);
    console.log(`   ${filepath}`);
    console.log(`   ${latestPath}`);

    return filepath;
  }

  /**
   * 执行一次完整的进化循环
   */
  async evolve() {
    console.log('\n' + '='.repeat(80));
    console.log('🧬 LX-PCEC 自动进化循环');
    console.log('='.repeat(80));

    const startTime = Date.now();

    // 1. 挖掘知识
    const hubDiscoveries = await this.mineFromHub();
    const localDiscoveries = await this.mineFromLocalCode();

    const allNew = [...hubDiscoveries, ...localDiscoveries];
    console.log(`\n📊 挖掘结果: ${allNew.length} 个新发现`);

    // 2. 整合知识
    await this.integrateKnowledge(allNew);

    // 3. 分析模式
    const patterns = await this.analyzeKnowledgePatterns();

    // 4. 生成洞察
    const insights = await this.generateInsights();

    // 5. 生成总结
    const summaryPath = await this.generateHourlySummary();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ 进化循环完成');
    console.log('='.repeat(80));

    console.log(`\n⏱️  耗时: ${elapsed} 秒`);
    console.log(`📊 总知识库: ${this.discoveries.length}`);
    console.log(`📄 总结: ${summaryPath}`);
    console.log(`\n⏰ 下次进化: 1 小时后`);

    return {
      discoveries: allNew.length,
      totalKnowledge: this.discoveries.length,
      patterns,
      insights,
      summaryPath,
      elapsed
    };
  }

  /**
   * 启动自动进化循环
   */
  async startAutoLoop() {
    console.log('\n🔄 启动自动进化循环...');
    console.log(`⏰ 间隔: ${CONFIG.interval / 1000} 秒 (1 小时)`);
    console.log(`📁 总结目录: ${CONFIG.summaryDir}\n`);

    // 立即执行一次
    await this.evolve();

    // 设置定时循环
    setInterval(async () => {
      console.log('\n' + '='.repeat(80));
      console.log(`⏰ 定时进化触发: ${new Date().toLocaleString('zh-CN')}`);
      console.log('='.repeat(80));

      try {
        await this.evolve();
      } catch (error) {
        console.error(`\n❌ 进化失败: ${error.message}`);
      }
    }, CONFIG.interval);

    console.log(`\n✅ 自动循环已启动`);
    console.log(`\n💡 提示: 可以通过 Ctrl+C 停止，或查看 ${CONFIG.summaryDir}`);
  }
}

// ==================== 主入口 ====================

async function main() {
  const system = new AutoEvolutionSystem();

  // 单次运行模式
  if (process.argv.includes('--once')) {
    await system.evolve();
    return;
  }

  // 自动循环模式
  if (process.argv.includes('--loop')) {
    system.startAutoLoop();
    return;
  }

  // 默认: 单次运行
  console.log('用法:');
  console.log('  node auto-evolution-system.js --once  # 运行一次');
  console.log('  node auto-evolution-system.js --loop  # 启动循环 (每小时)');
}

main().catch(console.error);
