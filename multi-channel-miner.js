#!/usr/bin/env node
/**
 * 多渠道知识挖掘系统
 *
 * 渠道:
 * 1. EvoMap Hub - 已实现
 * 2. GitHub - 代码和文档
 * 3. ClawdHub - OpenClaw 生态系统
 * 4. npm - 包和模块
 * 5. 技术博客和文章
 *
 * 目标:
 * - 从多个渠道主动挖掘知识
 * - 整合不同来源的知识
 * - 每小时发布进化总结
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'multi-channel'),
  channels: {
    evomap: {
      name: 'EvoMap Hub',
      type: 'api',
      priority: 'high',
      description: 'AI Agent 进化市场'
    },
    github: {
      name: 'GitHub',
      type: 'git',
      priority: 'high',
      description: '开源代码和文档'
    },
    clawdhub: {
      name: 'ClawdHub',
      type: 'cli',
      priority: 'high',
      description: 'OpenClaw 生态系统'
    },
    npm: {
      name: 'npm',
      type: 'registry',
      priority: 'medium',
      description: 'Node.js 包管理'
    }
  },
  // 挖掘主题
  topics: [
    'agent', 'multi-agent', 'collaboration',
    'automation', 'workflow', 'pipeline',
    'monitoring', 'health-check', 'watchdog',
    'knowledge', 'semantic', 'rag',
    'security', 'auth', 'validation',
    'testing', 'quality', 'ci-cd'
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ==================== GitHub 知识挖掘 ====================

class GitHubKnowledgeMiner {
  constructor() {
    this.baseDir = path.join(__dirname, 'knowledge-base', 'github-discoveries');
    ensureDir(this.baseDir);
  }

  /**
   * 搜索 GitHub 仓库
   */
  async searchRepositories(topic, limit = 10) {
    console.log(`\n📦 搜索 GitHub: ${topic}`);

    try {
      // 使用 gh CLI 搜索
      const cmd = `gh search repos --limit ${limit} --json name,description,url,stargazerCount,language,updatedAt "${topic} in:readme"`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });

      const repos = JSON.parse(output);
      console.log(`   找到 ${repos.length} 个仓库`);

      const qualityRepos = repos.filter(r =>
        r.stargazerCount >= 10 && // 至少 10 stars
        r.description && // 有描述
        r.updatedAt // 最近更新
      ).sort((a, b) => b.stargazerCount - a.stargazerCount);

      console.log(`   高质量: ${qualityRepos.length}`);

      return qualityRepos.map(repo => ({
        channel: 'github',
        type: 'repository',
        name: repo.name,
        description: repo.description,
        url: repo.url,
        stars: repo.stargazerCount,
        language: repo.language,
        updated: repo.updatedAt,
        quality: this.assessQuality(repo)
      }));

    } catch (error) {
      console.error(`   ❌ GitHub 搜索失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取仓库的 README
   */
  async getReadme(repoName) {
    console.log(`\n📄 获取 README: ${repoName}`);

    try {
      const cmd = `gh repo view ${repoName} --json readme --jq .readme`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });

      if (output && output !== 'null') {
        const readme = JSON.parse(output);
        console.log(`   README 长度: ${readme.length} 字符`);
        return readme;
      }

      return null;

    } catch (error) {
      console.error(`   ❌ 获取 README 失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 评估仓库质量
   */
  assessQuality(repo) {
    let score = 0;

    // Stars
    if (repo.stargazerCount >= 1000) score += 5;
    else if (repo.stargazerCount >= 100) score += 3;
    else if (repo.stargazerCount >= 10) score += 1;

    // 描述
    if (repo.description && repo.description.length >= 50) score += 2;
    else if (repo.description) score += 1;

    // 语言
    if (['TypeScript', 'JavaScript', 'Python'].includes(repo.language)) score += 1;

    return score;
  }

  /**
   * 分析 README 提取知识点
   */
  analyzeReadme(readme, repoName) {
    const knowledge = {
      repo: repoName,
      concepts: [],
      patterns: [],
      technologies: [],
      bestPractices: []
    };

    if (!readme) return knowledge;

    // 提取关键概念
    const conceptPatterns = [
      /architecture|design|pattern/gi,
      /framework|library|tool/gi,
      /system|module|component/gi,
      /workflow|pipeline|process/gi
    ];

    conceptPatterns.forEach(pattern => {
      const matches = readme.match(pattern);
      if (matches) {
        matches.forEach(m => {
          if (!knowledge.concepts.includes(m.toLowerCase())) {
            knowledge.concepts.push(m.toLowerCase());
          }
        });
      }
    });

    // 提取技术栈
    const techPatterns = [
      /React|Vue|Angular/g,
      /Node\.js|Express|Koa/g,
      /Python|Django|Flask/g,
      /Docker|Kubernetes/g,
      /Redis|MongoDB|PostgreSQL/g
    ];

    techPatterns.forEach(pattern => {
      const matches = readme.match(pattern);
      if (matches) {
        matches.forEach(m => {
          if (!knowledge.technologies.includes(m)) {
            knowledge.technologies.push(m);
          }
        });
      }
    });

    console.log(`   发现概念: ${knowledge.concepts.length}`);
    console.log(`   发现技术: ${knowledge.technologies.length}`);

    return knowledge;
  }
}

// ==================== ClawdHub 知识挖掘 ====================

class ClawdHubKnowledgeMiner {
  constructor() {
    this.baseDir = path.join(__dirname, 'knowledge-base', 'clawdhub-discoveries');
    ensureDir(this.baseDir);
  }

  /**
   * 搜索 ClawdHub
   */
  async search(topic) {
    console.log(`\n🦞 搜索 ClawdHub: ${topic}`);

    try {
      // 尝试使用 clawdhub CLI
      const cmd = `clawdhub search ${topic} --limit 10`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });

      const lines = output.split('\n').filter(line => line.trim());
      console.log(`   找到 ${lines.length} 个结果`);

      return lines.map(line => ({
        channel: 'clawdhub',
        type: 'package',
        name: line,
        topic: topic,
        quality: this.assessQuality(line)
      }));

    } catch (error) {
      console.error(`   ❌ ClawdHub 搜索失败: ${error.message}`);
      console.log(`   提示: clawdhub 可能未安装`);
      return [];
    }
  }

  /**
   * 获取包信息
   */
  async getPackageInfo(packageName) {
    console.log(`\n📦 获取包信息: ${packageName}`);

    try {
      const cmd = `clawdhub info ${packageName}`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 15000 });

      // 解析输出
      const info = {
        name: packageName,
        description: '',
        version: '',
        author: ''
      };

      output.split('\n').forEach(line => {
        if (line.includes('Description:')) {
          info.description = line.split('Description:')[1]?.trim();
        }
        if (line.includes('Version:')) {
          info.version = line.split('Version:')[1]?.trim();
        }
        if (line.includes('Author:')) {
          info.author = line.split('Author:')[1]?.trim();
        }
      });

      return info;

    } catch (error) {
      console.error(`   ❌ 获取包信息失败: ${error.message}`);
      return null;
    }
  }

  assessQuality(line) {
    // 简化的质量评估
    return 1;
  }
}

// ==================== npm 知识挖掘 ====================

class NpmKnowledgeMiner {
  constructor() {
    this.baseDir = path.join(__dirname, 'knowledge-base', 'npm-discoveries');
    ensureDir(this.baseDir);
  }

  /**
   * 搜索 npm 包
   */
  async search(topic, limit = 10) {
    console.log(`\n📦 搜索 npm: ${topic}`);

    try {
      const cmd = `npm search ${topic} --long --json | limit | head -n ${limit}`;
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 });

      let packages = [];
      try {
        packages = JSON.parse(output);
      } catch (e) {
        // npm search 可能不返回 JSON
        return [];
      }

      console.log(`   找到 ${packages.length} 个包`);

      const qualityPackages = packages.filter(pkg =>
        pkg.score &&
        pkg.score.final >= 0.7 // 高质量
      ).sort((a, b) => b.score.final - a.score.final);

      console.log(`   高质量: ${qualityPackages.length}`);

      return qualityPackages.map(pkg => ({
        channel: 'npm',
        type: 'package',
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        author: pkg.author,
        score: pkg.score?.final,
        quality: this.assessQuality(pkg)
      }));

    } catch (error) {
      console.error(`   ❌ npm 搜索失败: ${error.message}`);
      return [];
    }
  }

  assessQuality(pkg) {
    let score = 0;

    if (pkg.score?.final >= 0.9) score += 5;
    else if (pkg.score?.final >= 0.7) score += 3;
    else if (pkg.score?.final >= 0.5) score += 1;

    if (pkg.description && pkg.description.length >= 50) score += 2;

    return score;
  }
}

// ==================== 多渠道协调器 ====================

class MultiChannelKnowledgeMiner {
  constructor() {
    this.githubMiner = new GitHubKnowledgeMiner();
    this.clawdhubMiner = new ClawdHubKnowledgeMiner();
    this.npmMiner = new NpmKnowledgeMiner();

    this.allDiscoveries = [];
  }

  /**
   * 从所有渠道挖掘知识
   */
  async mineAll(topics) {
    console.log('🔍 多渠道知识挖掘系统');
    console.log('═══════════════════════════════════════════\n');

    for (const topic of topics) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎯 主题: ${topic}`);
      console.log(`${'='.repeat(80)}`);

      // 1. GitHub
      const githubRepos = await this.githubMiner.searchRepositories(topic);
      this.allDiscoveries.push(...githubRepos);

      // 2. ClawdHub
      const clawdhubPkgs = await this.clawdhubMiner.search(topic);
      this.allDiscoveries.push(...clawdhubPkgs);

      // 3. npm
      const npmPkgs = await this.npmMiner.search(topic);
      this.allDiscoveries.push(...npmPkgs);

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return this.allDiscoveries;
  }

  /**
   * 整合和分析发现
   */
  analyzeDiscoveries() {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 多渠道知识分析');
    console.log(`${'='.repeat(80)}\n`);

    // 按渠道统计
    const byChannel = {};
    this.allDiscoveries.forEach(d => {
      if (!byChannel[d.channel]) {
        byChannel[d.channel] = [];
      }
      byChannel[d.channel].push(d);
    });

    console.log(`📊 按渠道统计:\n`);
    Object.entries(byChannel).forEach(([channel, items]) => {
      console.log(`   ${channel}: ${items.length}`);
    });

    // 高质量发现
    const highQuality = this.allDiscoveries
      .filter(d => d.quality >= 5)
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 20);

    console.log(`\n🏆 高质量发现 (${highQuality.length}):\n`);
    highQuality.forEach((item, i) => {
      console.log(`   ${i + 1}. [${item.channel}] ${item.name}`);
      console.log(`      质量评分: ${item.quality}`);
      if (item.description) {
        console.log(`      描述: ${item.description.substring(0, 80)}...`);
      }
    });

    return {
      total: this.allDiscoveries.length,
      byChannel,
      highQuality
    };
  }
}

// ==================== 进化总结生成器 ====================

class EvolutionSummaryGenerator {
  constructor(outputDir) {
    this.outputDir = outputDir;
    ensureDir(outputDir);
  }

  /**
   * 生成每小时进化总结
   */
  async generateHourlySummary(discoveries, analysis) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const hour = now.getHours();

    let summary = `# ⏰ 每小时进化总结\n\n`;
    summary += `**时间**: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`;
    summary += `**第 ${hour} 点**\n\n`;
    summary += `---\n\n`;

    // 挖掘统计
    summary += `## 📊 本小时挖掘统计\n\n`;
    summary += `- **总发现**: ${discoveries.length}\n`;
    summary += `- **高质量**: ${analysis.highQuality.length}\n\n`;

    summary += `### 按渠道分布\n\n`;
    Object.entries(analysis.byChannel).forEach(([channel, items]) => {
      summary += `- **${channel}**: ${items.length}\n`;
    });
    summary += `\n`;

    // 顶级发现
    if (analysis.highQuality.length > 0) {
      summary += `## 🏆 本小时顶级发现\n\n`;
      analysis.highQuality.slice(0, 10).forEach((item, i) => {
        summary += `### ${i + 1}. [${item.channel}] ${item.name}\n\n`;
        if (item.description) {
          summary += `${item.description}\n\n`;
        }
        if (item.url) {
          summary += `🔗 [查看详情](${item.url})\n\n`;
        }
        summary += `**质量评分**: ${item.quality}/10\n\n`;
      });
    }

    // 知识提取
    summary += `## 💡 知识提取\n\n`;

    // 从 GitHub 仓库提取的概念
    const githubRepos = discoveries.filter(d => d.channel === 'github');
    if (githubRepos.length > 0) {
      summary += `### 发现的技术概念\n\n`;
      const concepts = new Set();
      githubRepos.forEach(repo => {
        if (repo.description) {
          const words = repo.description.toLowerCase().split(/\s+/);
          words.forEach(w => {
            if (w.length >= 5 && concepts.size < 20) {
              concepts.add(w);
            }
          });
        }
      });
      Array.from(concepts).slice(0, 15).forEach(c => {
        summary += `- \`${c}\`\n`;
      });
      summary += `\n`;
    }

    // 技术栈
    const techStack = new Map();
    discoveries.forEach(d => {
      if (d.language) {
        techStack.set(d.language, (techStack.get(d.language) || 0) + 1);
      }
    });

    if (techStack.size > 0) {
      summary += `### 技术栈分布\n\n`;
      Array.from(techStack.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([tech, count]) => {
          summary += `- **${tech}**: ${count}\n`;
        });
      summary += `\n`;
    }

    // 进化洞察
    summary += `## 🚀 进化洞察\n\n`;

    summary += `### 发现的趋势\n\n`;
    if (discoveries.length >= 10) {
      summary += `- ✅ 知识源丰富，多渠道挖掘有效\n`;
    } else {
      summary += `- ⚠️ 知识源较少，需要扩大搜索范围\n`;
    }

    if (analysis.highQuality.length >= 5) {
      summary += `- ✅ 发现多个高质量资源\n`;
    } else {
      summary += `- ⚠️ 高质量资源较少，需要优化搜索策略\n`;
    }

    summary += `\n### 下一步行动\n\n`;
    summary += `1. 深入研究高质量发现\n`;
    summary += `2. 提取核心概念和模式\n`;
    summary += `3. 整合到知识库\n`;
    summary += `4. 生成新的技能 (Capsules)\n`;
    summary += `5. 继续多渠道挖掘\n\n`;

    summary += `---\n\n`;
    summary += `*由 PCEC 多渠道知识挖掘系统自动生成*\n`;
    summary += `*下一份总结将在 1 小时后发布*\n`;

    // 保存
    const filename = `hourly-evolution-summary-${timestamp}.md`;
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, summary);

    // 同时保存最新版本
    const latestPath = path.join(this.outputDir, 'latest-hourly-summary.md');
    fs.writeFileSync(latestPath, summary);

    console.log(`\n📄 进化总结已保存:`);
    console.log(`   ${filepath}`);
    console.log(`   ${latestPath}`);

    return { filepath, latestPath };
  }
}

// ==================== 主系统 ====================

async function main() {
  console.log('🌐 PCEC 多渠道知识挖掘系统 v1.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('渠道: GitHub, ClawdHub, npm, EvoMap');
  console.log('目标: 主动挖掘知识，每小时发布进化总结\n');

  const outputDir = path.join(__dirname, 'knowledge-base', 'multi-channel');
  ensureDir(outputDir);

  // 1. 多渠道挖掘
  const miner = new MultiChannelKnowledgeMiner();
  const discoveries = await miner.mineAll(CONFIG.topics.slice(0, 3)); // 先测试 3 个主题

  // 2. 分析发现
  const analysis = miner.analyzeDiscoveries();

  // 3. 保存发现
  const discoveriesPath = path.join(outputDir, 'discoveries.json');
  fs.writeFileSync(discoveriesPath, JSON.stringify(discoveries, null, 2));
  console.log(`\n💾 发现已保存: ${discoveriesPath}`);

  // 4. 生成进化总结
  const summaryGen = new EvolutionSummaryGenerator(outputDir);
  const { filepath } = await summaryGen.generateHourlySummary(discoveries, analysis);

  // 5. 输出总结
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('✅ 多渠道知识挖掘完成');
  console.log(`${'='.repeat(80)}`);

  console.log(`\n📊 挖掘统计:`);
  console.log(`   总发现: ${analysis.total}`);
  console.log(`   高质量: ${analysis.highQuality.length}`);
  console.log(`   渠道数: ${Object.keys(analysis.byChannel).length}`);

  console.log(`\n📄 查看进化总结:`);
  console.log(`   ${filepath}`);

  console.log(`\n💡 下一步:`);
  console.log(`   1. 研究高质量发现`);
  console.log(`   2. 整合到知识库`);
  console.log(`   3. 每小时自动生成新总结`);
}

main().catch(console.error);
