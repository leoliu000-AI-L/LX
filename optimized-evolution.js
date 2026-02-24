#!/usr/bin/env node
/**
 * 优化后的自动进化系统
 *
 * 改进:
 * 1. 优化知识判断模型（不依赖 signals_match）
 * 2. 增加更多挖掘信号
 * 3. 提升进化总结质量
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
  // 扩展的挖掘信号
  knowledgeSignals: [
    ['agent', 'automation'],
    ['knowledge', 'system'],
    ['monitor', 'watchdog'],
    ['multi', 'agent', 'collab'],
    ['semantic', 'search'],
    ['evolution', 'learning'],
    ['lifecycle', 'state'],
    ['health', 'check'],
    ['auto', 'recovery'],
    ['robust', 'system'],
    ['test', 'quality'],
    ['security', 'auth']
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

class OptimizedAutoEvolution {
  constructor() {
    this.discoveries = [];
    this.lastEvolution = null;
  }

  /**
   * 优化的知识挖掘
   */
  async mineKnowledge() {
    console.log(`\n🔍 挖掘知识 (${CONFIG.knowledgeSignals.length} 个信号)...`);

    const newDiscoveries = [];

    for (const signals of CONFIG.knowledgeSignals) {
      try {
        const result = await hubSearch(signals, {
          threshold: 0.60,
          limit: 5,
          timeoutMs: 10000
        });

        if (result.hit) {
          const discovery = {
            channel: 'evomap',
            asset_id: result.asset_id,
            source: result.source_node_id,
            score: result.score,
            confidence: result.match?.confidence || 0.8,
            streak: result.match?.success_streak || 0,
            timestamp: new Date().toISOString()
          };

          newDiscoveries.push(discovery);
          console.log(`   ✅ ${result.asset_id?.substring(0, 20)}... (${result.score.toFixed(2)}, ${discovery.streak}次成功)`);
        }
      } catch (error) {
        console.log(`   ⚠️  ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
    }

    return newDiscoveries;
  }

  /**
   * 从本地挖掘
   */
  async mineLocal() {
    console.log(`\n📂 从本地代码库挖掘...`);

    try {
      const cmd = 'git log --since="1 hour ago" --pretty=format:"%h|%s|%ar" --stat';
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 5000 });

      const lines = output.trim().split('\n').filter(line => line);
      const commits = lines.slice(0, 10); // 最多 10 个

      console.log(`   最近提交: ${commits.length}`);

      return commits.map(commit => {
        const [hash, subject, author] = commit.split('|');
        return {
          channel: 'local',
          type: 'commit',
          hash,
          subject,
          author,
          timestamp: new Date().toISOString()
        };
      });

    } catch (error) {
      console.log(`   ⚠️  ${error.message}`);
      return [];
    }
  }

  /**
   * 优化的知识质量评估
   */
  assessQuality(discovery) {
    let score = 0;

    // 评分
    if (discovery.score >= 9.0) score += 5;
    else if (discovery.score >= 7.0) score += 3;
    else if (discovery.score >= 5.0) score += 1;

    // 成功记录
    if (discovery.streak >= 20) score += 3;
    else if (discovery.streak >= 10) score += 2;
    else if (discovery.streak >= 5) score += 1;

    // 置信度
    if (discovery.confidence >= 0.95) score += 2;
    else if (discovery.confidence >= 0.8) score += 1;

    return score;
  }

  /**
   * 整合知识
   */
  async integrateKnowledge(newDiscoveries) {
    console.log(`\n🔄 整合知识...`);

    const existingIds = new Set(this.discoveries.map(d => d.asset_id));
    const newUnique = newDiscoveries.filter(d => !existingIds.has(d.asset_id));

    console.log(`   新发现: ${newDiscoveries.length}`);
    console.log(`   新增: ${newUnique.length}`);

    // 为每个发现计算质量
    newUnique.forEach(d => {
      d.quality = this.assessQuality(d);
    });

    this.discoveries.push(...newUnique);

    return newUnique.length;
  }

  /**
   * 生成进化洞察
   */
  async generateInsights() {
    console.log(`\n💡 生成进化洞察...`);

    const insights = [];

    // 洞察 1: 知识积累
    if (this.discoveries.length >= 10) {
      insights.push({
        type: 'knowledge_growth',
        level: 'excellent',
        message: `📈 已积累 ${this.discoveries.length} 个知识资产`,
        action: '保持挖掘节奏'
      });
    }

    // 洞察 2: 质量分布
    const highQuality = this.discoveries.filter(d => d.score >= 7.0);
    const mediumQuality = this.discoveries.filter(d => d.score >= 5.0 && d.score < 7.0);

    if (highQuality.length >= 3) {
      insights.push({
        type: 'quality_status',
        level: 'excellent',
        message: `⭐ 高质量资产: ${highQuality.length} 个`,
        action: '优先学习这些资产'
      });
    }

    // 洞察 3: 发现趋势
    const recentHour = this.discoveries.slice(-10);
    const avgScore = recentHour.reduce((sum, d) => sum + (d.score || 0), 0) / recentHour.length;

    insights.push({
      type: 'recent_trend',
      level: avgScore >= 7.0 ? 'good' : 'normal',
      message: `📊 最近平均评分: ${avgScore.toFixed(2)}`,
      action: avgScore >= 7.0 ? '质量优秀' : '继续提高筛选标准'
    });

    // 洞察 4: 进化速度
    if (this.lastEvolution) {
      const hoursSince = Math.floor((Date.now() - this.lastEvolution) / 3600000);
      insights.push({
        type: 'evolution_pace',
        level: 'info',
        message: `⏰ 距上次进化: ${hoursSince} 小时`,
        action: hoursSince <= 1 ? '进化积极' : '保持稳定节奏'
      });
    }

    this.lastEvolution = Date.now();

    console.log(`   生成洞察: ${insights.length}`);

    return insights;
  }

  /**
   * 生成增强的进化总结
   */
  async generateEnhancedSummary() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const hour = now.getHours();
    const date = now.toLocaleDateString('zh-CN');

    let summary = `# ⏰ 每小时进化总结\n\n`;
    summary += `**日期**: ${date}\n`;
    summary += `**时间**: ${now.toLocaleTimeString('zh-CN')}\n`;
    summary += `**节点**: node_514d17ec9eaa04a4 (LX-PCEC v7.0)\n`;
    summary += `**知识库规模**: ${this.discoveries.length} 个资产\n\n`;
    summary += `---\n\n`;

    // 1. 本小时挖掘统计
    summary += `## 📊 本小时挖掘统计\n\n`;

    const recentDiscoveries = this.discoveries.slice(-20);
    const channelCounts = {};
    recentDiscoveries.forEach(d => {
      channelCounts[d.channel] = (channelCounts[d.channel] || 0) + 1;
    });

    summary += `### 渠道分布\n\n`;
    Object.entries(channelCounts).forEach(([channel, count]) => {
      summary += `- **${channel}**: ${count}\n`;
    });
    summary += `\n**总计**: ${recentDiscoveries.length} (最近 20 个)\n\n`;

    // 2. 顶级发现
    if (this.discoveries.length > 0) {
      summary += `## 🏆 顶级知识资产\n\n`;

      const topOnes = this.discoveries
        .filter(d => d.score)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      topOnes.forEach((d, i) => {
        summary += `### ${i + 1}. ${d.asset_id?.substring(0, 30)}...\n\n`;
        summary += `- **评分**: ${d.score.toFixed(2)}`;
        if (d.streak > 0) summary += ` | **成功**: ${d.streak}次`;
        summary += `\n`;
        summary += `- **来源**: ${d.source}\n`;
        summary += `- **置信度**: ${d.confidence.toFixed(2)}\n`;
        summary += `- **质量评级**: ${d.quality || 0}/10\n\n`;
      });
    }

    // 3. 进化洞察
    const insights = await this.generateInsights();

    if (insights.length > 0) {
      summary += `## 💡 进化洞察\n\n`;

      insights.forEach((insight, i) => {
        const icon = insight.level === 'excellent' ? '🌟' :
                     insight.level === 'good' ? '⭐' :
                     insight.level === 'normal' ? '📊' : '💡';
        summary += `### ${icon} ${insight.message}\n\n`;
        if (insight.action) {
          summary += `**行动**: ${insight.action}\n\n`;
        }
      });
    }

    // 4. 知识库质量分析
    summary += `## 📚 知识库质量分析\n\n`;

    const qualityDistribution = {
      excellent: this.discoveries.filter(d => d.score >= 9.0).length,
      good: this.discoveries.filter(d => d.score >= 7.0 && d.score < 9.0).length,
      medium: this.discoveries.filter(d => d.score >= 5.0 && d.score < 7.0).length,
      low: this.discoveries.filter(d => d.score < 5.0).length
    };

    summary += `### 评分分布\n\n`;
    summary += `- 🌟🌟🌟🌟🌟 优秀 (≥9.0): ${qualityDistribution.excellent}\n`;
    summary += `- ⭐⭐⭐⭐ 良好 (7.0-9.0): ${qualityDistribution.good}\n`;
    summary += `- ⭐⭐⭐ 一般 (5.0-7.0): ${qualityDistribution.medium}\n`;
    summary += `- ⭐⭐ 较低 (<5.0): ${qualityDistribution.low}\n\n`;

    // 成功记录分析
    const provenAssets = this.discoveries.filter(d => d.streak >= 10);
    if (provenAssets.length > 0) {
      summary += `### 经过验证的资产\n\n`;
      summary += `成功记录 ≥ 10 次: ${provenAssets.length} 个\n`;
      provenAssets.slice(0, 5).forEach(asset => {
        summary += `- ${asset.asset_id?.substring(0, 25)}... (${asset.streak}次)\n`;
      });
      summary += `\n`;
    }

    // 5. 学习建议
    summary += `## 🎯 学习建议\n\n`;

    const topAssets = this.discoveries
      .filter(d => d.score >= 7.0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (topAssets.length > 0) {
      summary += `### 优先学习\n\n`;
      topAssets.forEach((asset, i) => {
        summary += `${i + 1}. [${asset.asset_id?.substring(0, 25)}...](${asset.score.toFixed(2)})\n`;
        summary += `   - 来源: ${asset.source}\n`;
        summary += `   - 学习其实现模式和最佳实践\n`;
      });
      summary += `\n`;
    }

    // 6. 下小时计划
    summary += `## 🚀 下小时计划\n\n`;
    summary += `1. 📡 继续从 EvoMap 挖掘 (12 个信号)\n`;
    summary += `2. 🔍 深入分析新发现的高质量资产\n`;
    summary += `3. 🧠 整合知识到知识库\n`;
    summary += `4. ⚙️ 优化知识判断模型\n`;
    summary += `5. 📦 创建基于知识的技能 (Capsules)\n`;
    summary += `6. 📄 发布新的进化总结\n\n`;

    summary += `---\n\n`;
    summary += `*由 LX-PCEC v7.0 自动进化系统生成*\n`;
    summary += `*进化永不停止，学习永不止步！*\n`;
    summary += `*下一份总结: 1 小时后 (${hour + 1} 点)*\n`;

    // 保存
    ensureDir(CONFIG.summaryDir);
    const filename = `hourly-evolution-${timestamp}.md`;
    const filepath = path.join(CONFIG.summaryDir, filename);
    fs.writeFileSync(filepath, summary);

    const latestPath = path.join(CONFIG.summaryDir, 'latest-hourly-evolution.md');
    fs.writeFileSync(latestPath, summary);

    console.log(`\n📄 进化总结已保存:`);
    console.log(`   ${filepath}`);
    console.log(`   ${latestPath}`);

    return filepath;
  }

  /**
   * 执行一次优化的进化循环
   */
  async evolve() {
    console.log('\n' + '='.repeat(80));
    console.log('🧬 LX-PCEC 优化自动进化循环');
    console.log('='.repeat(80));

    const startTime = Date.now();

    // 1. 挖掘知识
    const hubDiscoveries = await this.mineKnowledge();
    const localDiscoveries = await this.mineLocal();

    const allNew = [...hubDiscoveries, ...localDiscoveries];
    console.log(`\n📊 挖掘结果: ${allNew.length} 个新发现`);

    // 2. 整合知识
    await this.integrateKnowledge(allNew);

    // 3. 生成洞察
    await this.generateInsights();

    // 4. 生成总结
    const summaryPath = await this.generateEnhancedSummary();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ 进化循环完成');
    console.log('='.repeat(80));

    console.log(`\n⏱️  耗时: ${elapsed} 秒`);
    console.log(`📚 总知识库: ${this.discoveries.length}`);
    console.log(`📄 总结: ${summaryPath}`);
    console.log(`\n⏰ 下次进化: 1 小时后`);

    return {
      discoveries: allNew.length,
      totalKnowledge: this.discoveries.length,
      elapsed
    };
  }
}

// 主程序
async function main() {
  const system = new OptimizedAutoEvolution();

  // 单次运行
  if (process.argv.includes('--once')) {
    await system.evolve();
    return;
  }

  // 自动循环
  if (process.argv.includes('--loop')) {
    console.log('\n🔄 启动自动进化循环...');
    console.log(`⏰ 间隔: 1 小时`);

    // 立即执行一次
    await system.evolve();

    // 设置循环
    setInterval(async () => {
      console.log('\n' + '='.repeat(80));
      console.log(`⏰ 定时进化触发: ${new Date().toLocaleString('zh-CN')}`);
      console.log('='.repeat(80));

      try {
        await system.evolve();
      } catch (error) {
        console.error(`\n❌ 进化失败: ${error.message}`);
      }
    }, 3600000); // 1 小时

    console.log(`\n✅ 自动循环已启动`);
  }
}

main().catch(console.error);
