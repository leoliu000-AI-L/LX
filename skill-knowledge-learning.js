#!/usr/bin/env node
/**
 * 技能-知识组装学习系统
 *
 * 核心理念:
 * - 知识 = 元数据 (Gene) - 定义"是什么"、"为什么"
 * - 技能 = 能力 (Capsule) - 实现"怎么做"
 * - 技能组装 = 用知识元数据生成和组合技能
 *
 * 学习目标:
 * 1. 发现社区中的顶级技能 (Capsules)
 * 2. 分析技能背后的知识基础 (Genes)
 * 3. 理解如何用知识组装生成技能
 * 4. 建立知识→技能的映射关系
 */

const fs = require('fs');
const path = require('path');

process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'skill-knowledge-assembly'),
  // 技能相关的信号 - 寻找实际的能力实现
  skillSignals: [
    // 执行技能
    ['execute', 'action', 'do'],
    ['perform', 'task', 'operation'],
    ['run', 'process', 'workflow'],

    // 创建技能
    ['create', 'build', 'make'],
    ['generate', 'produce', 'output'],
    ['implement', 'realize', 'materialize'],

    // 变换技能
    ['transform', 'convert', 'change'],
    ['process', 'handle', 'manipulate'],
    ['adapt', 'adjust', 'modify'],

    // 分析技能
    ['analyze', 'examine', 'inspect'],
    ['evaluate', 'assess', 'judge'],
    ['diagnose', 'troubleshoot', 'debug'],

    // 管理技能
    ['manage', 'control', 'orchestrate'],
    ['coordinate', 'synchronize', 'align'],
    ['organize', 'structure', 'arrange'],

    // 学习技能
    ['learn', 'acquire', 'master'],
    ['improve', 'enhance', 'optimize'],
    ['evolve', 'adapt', 'grow'],

    // 交互技能
    ['communicate', 'interact', 'exchange'],
    ['collaborate', 'cooperate', 'teamwork'],
    ['respond', 'react', 'feedback'],

    // 创造技能
    ['design', 'invent', 'innovate'],
    ['synthesize', 'combine', 'integrate'],
    ['compose', 'construct', 'assemble']
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function searchSkills() {
  console.log('🔧 搜索技能相关的 Capsules (实际能力)\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const skills = [];
  const categories = {
    execution: [],
    creation: [],
    transformation: [],
    analysis: [],
    management: [],
    learning: [],
    interaction: [],
    innovation: []
  };

  for (let i = 0; i < CONFIG.skillSignals.length; i++) {
    const signals = CONFIG.skillSignals[i];
    const categoryKeys = Object.keys(categories);
    const category = categoryKeys[i % categoryKeys.length];

    console.log(`\n🔍 搜索 ${i + 1}/${CONFIG.skillSignals.length}: ${signals.join(', ')}`);

    try {
      const searchResult = await hubSearch(signals, {
        threshold: 0.60,
        limit: 5,
        timeoutMs: 12000,
      });

      const skill = {
        signals,
        category,
        found: false,
        capsule: null,
        gene: null
      };

      if (searchResult.hit && searchResult.match?.type === 'Capsule') {
        console.log(`✅ 找到技能!`);
        console.log(`   Capsule: ${searchResult.match?.local_id || searchResult.asset_id?.substring(0, 20)}`);
        console.log(`   来源: ${searchResult.source_node_id}`);
        console.log(`   评分: ${searchResult.score.toFixed(2)}`);
        console.log(`   置信度: ${searchResult.match?.confidence}`);
        console.log(`   触发: ${(searchResult.match?.trigger || []).slice(0, 3).join(', ')}`);

        skill.found = true;
        skill.capsule = {
          asset_id: searchResult.asset_id,
          local_id: searchResult.match?.local_id,
          source_node_id: searchResult.source_node_id,
          score: searchResult.score,
          confidence: searchResult.match?.confidence,
          success_streak: searchResult.match?.success_streak,
          trigger: searchResult.match?.trigger,
          blast_radius: searchResult.match?.blast_radius,
          gene: searchResult.match?.gene // 知识基础！
        };

        // 提取 gene (知识)
        if (searchResult.match?.gene) {
          console.log(`   🧬 Gene (知识): ${searchResult.match.gene.substring(0, 30)}...`);
          skill.gene = searchResult.match.gene;
        }

        categories[category].push(skill.capsule);
        skills.push(skill);

      } else if (searchResult.hit) {
        console.log(`⚠️  找到资产但不是 Capsule (类型: ${searchResult.match?.type})`);
      } else {
        console.log(`⚠️  未找到匹配: ${searchResult.reason}`);
      }

    } catch (error) {
      console.error(`❌ 搜索失败: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return { skills, categories };
}

async function analyzeSkillKnowledgeAssembly({ skills, categories }) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 技能-知识组装分析');
  console.log(`${'='.repeat(80)}\n`);

  // 统计
  const totalSearched = skills.length;
  const skillsFound = skills.filter(s => s.found).length;
  const skillsWithGenes = skills.filter(s => s.gene).length;
  const discoveryRate = (skillsFound / totalSearched * 100).toFixed(1);

  console.log(`📈 技能发现统计:`);
  console.log(`   搜索范围: ${totalSearched}`);
  console.log(`   找到技能: ${skillsFound}`);
  console.log(`   有知识基础: ${skillsWithGenes}`);
  console.log(`   发现率: ${discoveryRate}%\n`);

  // 按类别统计
  console.log(`📊 按技能类别统计:\n`);
  Object.entries(categories).forEach(([cat, capsules]) => {
    const count = capsules.length;
    if (count > 0) {
      const avgScore = (capsules.reduce((sum, c) => sum + (c.score || 0), 0) / count).toFixed(2);
      const withGenes = capsules.filter(c => c.gene).length;

      console.log(`   ${cat}:`);
      console.log(`     技能数: ${count}`);
      console.log(`     平均评分: ${avgScore}`);
      console.log(`     有知识基础: ${withGenes}/${count}`);

      if (count > 0) {
        const best = capsules.reduce((max, c) => (c.score || 0) > (max.score || 0) ? c : max);
        console.log(`     最佳: ${best.local_id || best.asset_id?.substring(0, 20)} (${best.score?.toFixed(2)})`);
      }
      console.log(``);
    }
  });

  // 顶级技能
  const allCapsules = Object.values(categories).flat();
  const topSkills = allCapsules
    .filter(c => (c.score || 0) >= 5.0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);

  if (topSkills.length > 0) {
    console.log(`🏆 顶级技能 (评分 ≥ 5.0):\n`);
    topSkills.forEach((skill, i) => {
      console.log(`   ${i + 1}. ${skill.local_id || skill.asset_id?.substring(0, 25)}`);
      console.log(`      评分: ${skill.score?.toFixed(2)} | 置信度: ${skill.confidence}`);
      console.log(`      来源: ${skill.source_node_id}`);
      console.log(`      触发: ${(skill.trigger || []).slice(0, 2).join(', ')}`);
      console.log(`      🧬 Gene: ${skill.gene ? '✅ 有知识基础' : '⚠️  无知识基础'}`);
      console.log(``);
    });
  }

  // 分析知识→技能的映射
  console.log(`🔗 知识→技能映射分析:\n`);

  const geneUsage = {};
  skills.filter(s => s.found && s.gene).forEach(skill => {
    const gene = skill.gene;
    if (!geneUsage[gene]) {
      geneUsage[gene] = {
        gene,
        skills: [],
        diversity: new Set()
      };
    }
    geneUsage[gene].skills.push(skill.capsule);
    geneUsage[gene].diversity.add(skill.category);
  });

  // 一个知识生成多个技能的情况
  const multiSkillGenes = Object.values(geneUsage)
    .filter(g => g.skills.length > 1)
    .sort((a, b) => b.skills.length - a.skills.length)
    .slice(0, 5);

  if (multiSkillGenes.length > 0) {
    console.log(`💡 一个知识生成多个技能:\n`);
    multiSkillGenes.forEach((item, i) => {
      console.log(`   ${i + 1}. Gene: ${item.gene.substring(0, 30)}...`);
      console.log(`      生成技能数: ${item.skills.length}`);
      console.log(`      技能类别: ${Array.from(item.diversity).join(', ')}`);
      console.log(``);
    });
  }

  // 技能组装模式分析
  console.log(`🧩 技能组装模式分析:\n`);

  const patterns = {
    single_knowledge: skills.filter(s => s.found && s.gene).length,
    no_knowledge: skills.filter(s => s.found && !s.gene).length,
    multi_knowledge: 0 // 需要更详细的分析
  };

  console.log(`   单一知识→技能: ${patterns.single_knowledge}`);
  console.log(`   无知识基础→技能: ${patterns.no_knowledge}`);
  console.log(`   多知识组装→技能: ${patterns.multi_knowledge} (待分析)\n`);

  return {
    totalSearched,
    skillsFound,
    skillsWithGenes,
    discoveryRate,
    topSkills,
    geneUsage,
    assemblyPatterns: patterns
  };
}

function generateSkillKnowledgeReport(analysis) {
  let report = `# 🧩 技能-知识组装分析报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n`;
  report += `**核心理念**: 知识 = 元数据 (Gene), 技能 = 能力 (Capsule)\n\n`;
  report += `---\n\n`;

  // 核心概念
  report += `## 💡 核心概念: 知识 vs 技能\n\n`;

  report += `### 知识 (Knowledge) = Gene (元数据)\n`;
  report += `- 定义: **是什么** (what)\n`;
  report += `- 解释: **为什么** (why)\n`;
  report += `- 提供理论基础\n`;
  report += `- 描述策略和方法\n\n`;

  report += `### 技能 (Skill) = Capsule (能力)\n`;
  report += `- 实现: **怎么做** (how)\n`;
  report += `- 执行: 实际操作\n`;
  report += `- 依赖: 知识基础 (gene)\n`;
  report += `- 触发: 特定条件\n\n`;

  report += `### 组装关系\n`;
  report += `**知识 (Gene)** → **技能 (Capsule)** → **实际应用**\n\n`;

  // 发现统计
  report += `## 📊 发现统计\n\n`;
  report += `- **搜索范围**: ${analysis.totalSearched} 个技能信号\n`;
  report += `- **发现技能**: ${analysis.skillsFound}\n`;
  report += `- **有知识基础**: ${analysis.skillsWithGenes}\n`;
  report += `- **发现率**: ${analysis.discoveryRate}%\n\n`;

  // 顶级技能
  if (analysis.topSkills.length > 0) {
    report += `## 🏆 顶级技能分析\n\n`;

    analysis.topSkills.slice(0, 5).forEach((skill, i) => {
      report += `### ${i + 1}. ${skill.local_id || skill.asset_id?.substring(0, 30)}\n\n`;
      report += `- **评分**: ${skill.score?.toFixed(2)}\n`;
      report += `- **置信度**: ${skill.confidence}\n`;
      report += `- **来源**: ${skill.source_node_id}\n`;
      report += `- **触发信号**: ${(skill.trigger || []).join(', ')}\n`;
      report += `- **知识基础**: ${skill.gene ? `✅ \`${skill.gene.substring(0, 40)}...\`` : '⚠️ 无' }\n\n`;
    });
  }

  // 知识复用模式
  if (Object.keys(analysis.geneUsage).length > 0) {
    report += `## 🔁 知识复用模式\n\n`;

    const multiSkillGenes = Object.values(analysis.geneUsage)
      .filter(g => g.skills.length > 1)
      .sort((a, b) => b.skills.length - a.skills.length)
      .slice(0, 5);

    if (multiSkillGenes.length > 0) {
      report += `### 一个知识生成多个技能\n\n`;
      multiSkillGenes.forEach((item, i) => {
        report += `#### ${i + 1}. ${item.gene.substring(0, 50)}...\n\n`;
        report += `- **生成技能数**: ${item.skills.length}\n`;
        report += `- **技能类别**: ${Array.from(item.diversity).join(', ')}\n`;
        report += `- **技能列表**:\n`;
        item.skills.forEach((skill, j) => {
          report += `  ${j + 1}. ${skill.local_id || skill.asset_id?.substring(0, 30)} (${skill.score?.toFixed(2)})\n`;
        });
        report += `\n`;
      });
    }
  }

  // 组装模式
  report += `## 🧩 技能组装模式\n\n`;

  report += `### 发现的模式\n\n`;
  report += `1. **单一知识→单一技能** (${analysis.assemblyPatterns.single_knowledge} 个)\n`;
  report += `   - 最常见的模式\n`;
  report += `   - 一个 Gene 支撑一个 Capsule\n\n`;

  report += `2. **无知识基础→技能** (${analysis.assemblyPatterns.no_knowledge} 个)\n`;
  report += `   - 纯实践技能\n`;
  report += `   - 可能缺少理论支撑\n`;
  report += `   - 建议: 提取知识形成 Gene\n\n`;

  report += `3. **多知识组装→技能** (待深入分析)\n`;
  report += `   - 高级模式\n`;
  report += `   - 多个 Gene 组合生成复杂技能\n\n`;

  // 学习要点
  report += `## 📚 关键学习要点\n\n`;

  report += `### 1. 知识是技能的元数据\n`;
  report += `- Gene 定义了技能的理论基础\n`;
  report += `- Capsule 实现了技能的实际执行\n`;
  report += `- 分离关注点: 理论 vs 实践\n\n`;

  report += `### 2. 知识可以复用\n`;
  if (Object.values(analysis.geneUsage).some(g => g.skills.length > 1)) {
    report += `- 一个 Gene 可以支撑多个 Capsule\n`;
    report += `- 体现了知识的通用性\n`;
    report += `- 提高了开发效率\n\n`;
  }

  report += `### 3. 技能需要知识基础\n`;
  report += `- 有 Gene 的技能: 更可靠、可理解\n`;
  report += `- 无 Gene 的技能: 需要补充知识\n`;
  report += `- 建议: 所有技能都应有知识支撑\n\n`;

  // 实践建议
  report += `## 💡 实践建议\n\n`;

  report += `### 对于技能开发\n`;
  report += `1. **先定义知识** (Gene)\n`;
  report += `   - 明确"是什么"和"为什么"\n`;
  report += `   - 描述策略和方法\n`;
  report += `   - 提供理论基础\n\n`;

  report += `2. **再实现技能** (Capsule)\n`;
  report += `   - 基于 Gene 设计实现\n`;
  report += `   - 定义触发条件\n`;
  report += `   - 指定影响范围\n\n`;

  report += `3. **组装复杂技能**\n`;
  report += `   - 组合多个 Gene\n`;
  report += `   - 生成复合能力\n`;
  report += `   - 提升技能水平\n\n`;

  report += `### 对于知识管理\n`;
  report += `1. **建立知识库**\n`;
  report += `   - 收集高质量的 Genes\n`;
  report += `   - 分类和索引\n`;
  report += `   - 便于复用\n\n`;

  report += `2. **知识验证**\n`;
  report += `   - 检查 Gene 的质量\n`;
  report += `   - 验证理论的正确性\n`;
  report += `   - 确保可实践性\n\n`;

  report += `3. **知识进化**\n`;
  report += `   - 基于实践反馈\n`;
  report += `   - 更新 Gene 内容\n`;
  report += `   - 持续改进\n\n`;

  // 与我们系统的对比
  report += `## 🔄 与 PCEC 系统的对比\n\n`;

  report += `### 我们已有的 ✅\n`;
  report += `- 知识判断系统 (评估 Genes)\n`;
  report += `- 关系挖掘 (发现知识关联)\n`;
  report += `- 知识组装 (组合知识点)\n\n`;

  report += `### 需要增强 ⚠️\n`;
  report += `- **技能发现**: 寻找顶级 Capsules\n`;
  report += `- **知识→技能映射**: 理解如何用知识生成技能\n`;
  report += `- **技能组装**: 组合多个 Gene 生成复杂技能\n`;
  report += `- **验证机制**: 确保技能有知识基础\n\n`;

  report += `### 改进方向 🚀\n`;
  report += `1. 建立 Gene 知识库\n`;
  report += `2. 实现技能生成器 (Gene → Capsule)\n`;
  report += `3. 开发技能组装工具 (多 Genes → 复杂技能)\n`;
  report += `4. 创建技能验证系统\n\n`;

  report += `---\n\n`;
  report += `*本报告由 PCEC 技能-知识组装学习系统生成*\n`;

  return report;
}

async function main() {
  console.log('🧩 PCEC 技能-知识组装学习系统 v1.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('核心理念: 知识 = 元数据 (Gene), 技能 = 能力 (Capsule)\n');
  console.log('目标: 理解如何用知识组装生成技能\n');

  ensureDir(CONFIG.outputDir);

  // 1. 搜索技能
  const searchData = await searchSkills();

  // 2. 保存搜索结果
  const resultsPath = path.join(CONFIG.outputDir, 'skill-search-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(searchData, null, 2));
  console.log(`\n💾 搜索结果已保存: ${resultsPath}`);

  // 3. 分析技能-知识组装
  const analysis = await analyzeSkillKnowledgeAssembly(searchData);

  // 4. 保存分析结果
  const analysisPath = path.join(CONFIG.outputDir, 'skill-knowledge-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  console.log(`💾 分析结果已保存: ${analysisPath}`);

  // 5. 生成报告
  const report = generateSkillKnowledgeReport(analysis);
  const reportPath = path.join(CONFIG.outputDir, 'skill-knowledge-assembly-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`📄 分析报告已保存: ${reportPath}`);

  // 6. 输出总结
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('✅ 技能-知识组装学习完成');
  console.log(`${'='.repeat(80)}`);

  console.log(`\n📊 学习成果:`);
  console.log(`   搜索范围: ${analysis.totalSearched} 个技能信号`);
  console.log(`   发现技能: ${analysis.skillsFound}`);
  console.log(`   有知识基础: ${analysis.skillsWithGenes}`);
  console.log(`   发现率: ${analysis.discoveryRate}%`);

  if (analysis.topSkills.length > 0) {
    console.log(`\n🏆 值得学习的顶级技能:`);
    analysis.topSkills.slice(0, 3).forEach((skill, i) => {
      const hasGene = skill.gene ? '✅' : '⚠️';
      console.log(`   ${i + 1}. ${skill.local_id || skill.asset_id?.substring(0, 25)} ${hasGene}`);
      console.log(`      评分: ${skill.score?.toFixed(2)} | Gene: ${skill.gene ? '有' : '无'}`);
    });
  }

  console.log(`\n💡 核心发现:`);
  console.log(`   1. 知识 (Gene) = 元数据，定义"是什么"、"为什么"`);
  console.log(`   2. 技能 (Capsule) = 能力，实现"怎么做"`);
  console.log(`   3. 技能应该基于知识组装生成`);
  console.log(`   4. 一个知识可以生成多个技能\n`);
}

main().catch(console.error);
