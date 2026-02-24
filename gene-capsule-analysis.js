#!/usr/bin/env node
/**
 * Gene-Capsule 关系分析系统
 *
 * 直接分析已知高质量资产的 Gene 和 Capsule 关系
 * 理解: 知识 (Gene) 如何组装生成技能 (Capsule)
 */

const fs = require('fs');
const path = require('path');

process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'gene-capsule-analysis'),
  // 已知的高质量资产
  targetAssets: [
    {
      name: 'Lifecycle Watchdog',
      signals: ['watchdog', 'lifecycle', 'monitor', 'loop', 'evolve', 'automation'],
      description: 'OpenClaw 专家的顶级资产'
    },
    {
      name: 'Knowledge Discovery',
      signals: ['knowledge', 'discovery', 'mining'],
      description: '评分 9.90 的知识发现系统'
    },
    {
      name: 'Knowledge Evolution',
      signals: ['knowledge', 'evolution', 'learning'],
      description: '评分 6.38 的知识进化系统'
    },
    {
      name: 'Process Supervision',
      signals: ['process', 'supervisor', 'daemon'],
      description: '进程监控和管理'
    }
  ]
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function analyzeAssetGeneCapsule(asset) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 分析: ${asset.name}`);
  console.log(`信号: ${asset.signals.join(', ')}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const searchResult = await hubSearch(asset.signals, {
      threshold: 0.60,
      limit: 5,
      timeoutMs: 15000,
    });

    const analysis = {
      asset: asset,
      found: false,
      capsules: [],
      genes: [],
      relationships: []
    };

    if (searchResult.hit) {
      console.log(`✅ 找到匹配!`);
      console.log(`   Asset ID: ${searchResult.asset_id}`);
      console.log(`   来源: ${searchResult.source_node_id}`);
      console.log(`   评分: ${searchResult.score.toFixed(2)}`);
      console.log(`   类型: ${searchResult.match?.type}`);

      analysis.found = true;

      const match = searchResult.match;

      // 分析 Capsule (技能)
      if (match?.type === 'Capsule') {
        console.log(`\n📦 Capsule (技能) 分析:`);
        console.log(`   本地ID: ${match.local_id}`);
        console.log(`   触发信号: ${(match.trigger || []).join(', ')}`);
        console.log(`   置信度: ${match.confidence}`);
        console.log(`   成功记录: ${match.success_streak}`);
        console.log(`   影响范围: ${JSON.stringify(match.blast_radius)}`);

        analysis.capsules.push({
          asset_id: searchResult.asset_id,
          local_id: match.local_id,
          trigger: match.trigger,
          confidence: match.confidence,
          success_streak: match.success_streak,
          blast_radius: match.blast_radius
        });

        // 分析 Gene (知识基础)
        if (match.gene) {
          console.log(`\n🧬 Gene (知识基础) 分析:`);
          console.log(`   Gene ID: ${match.gene}`);

          analysis.genes.push({
            gene_id: match.gene,
            relationship: 'knowledge_base'
          });

          analysis.relationships.push({
            type: 'gene_to_capsule',
            from: match.gene,
            to: searchResult.asset_id,
            description: '知识定义技能的理论基础'
          });
        } else {
          console.log(`\n⚠️  无 Gene (缺少知识基础)`);
        }

        // 分析 signals_match (能力特征)
        if (match.signals_match && match.signals_match.length > 0) {
          console.log(`\n⚡ 能力特征 (signals_match):`);
          match.signals_match.slice(0, 10).forEach((signal, i) => {
            console.log(`   ${i + 1}. ${signal}`);
          });
        }
      } else {
        console.log(`\n⚠️  不是 Capsule 类型 (${match?.type})`);
      }

    } else {
      console.log(`⚠️  未找到匹配: ${searchResult.reason}`);
    }

    return analysis;

  } catch (error) {
    console.error(`❌ 分析失败: ${error.message}`);
    return {
      asset: asset,
      found: false,
      error: error.message
    };
  }
}

function generateGeneCapsuleInsight(allAnalyses) {
  const successful = allAnalyses.filter(a => a.found && !a.error);

  let insight = `# 🧬 Gene-Capsule 关系洞察报告\n\n`;
  insight += `**生成时间**: ${new Date().toISOString()}\n`;
  insight += `**分析数量**: ${allAnalyses.length}\n`;
  insight += `**成功分析**: ${successful.length}\n\n`;
  insight += `---\n\n`;

  // 核心概念
  insight += `## 💡 核心概念: 知识 vs 技能\n\n`;

  insight += `### Gene (知识/元数据) = "是什么" + "为什么"\n`;
  insight += `- **定义**: 理论基础\n`;
  insight += `- **内容**: 策略、方法、原理\n`;
  insight += `- **作用**: 指导技能实现\n`;
  insight += `- **示例**: "lifecycle_watchdog 理论"\n\n`;

  insight += `### Capsule (技能/能力) = "怎么做"\n`;
  insight += `- **定义**: 实际执行能力\n`;
  insight += `- **内容**: 代码、实现、操作\n`;
  insight += `- **作用**: 解决实际问题\n`;
  insight += `- **依赖**: Gene (知识基础)\n`;
  insight += `- **示例**: "process_start 触发 → 启动监控"\n\n`;

  insight += `### 组装关系\n`;
  insight += `**Gene** (知识) → 定义 → **Capsule** (技能) → 执行 → **结果**\n\n`;

  // 分析结果
  insight += `## 📊 分析结果\n\n`;

  successful.forEach((analysis, i) => {
    insight += `### ${i + 1}. ${analysis.asset.name}\n\n`;
    insight += `**描述**: ${analysis.asset.description}\n\n`;

    if (analysis.capsules.length > 0) {
      const capsule = analysis.capsules[0];
      insight += `**技能 (Capsule)**:\n`;
      insight += `- ID: ${capsule.local_id || capsule.asset_id?.substring(0, 20)}\n`;
      insight += `- 触发: ${(capsule.trigger || []).join(', ')}\n`;
      insight += `- 置信度: ${capsule.confidence}\n`;
      insight += `- 成功: ${capsule.success_streak} 次\n\n`;
    }

    if (analysis.genes.length > 0) {
      const gene = analysis.genes[0];
      insight += `**知识 (Gene)**:\n`;
      insight += `- ID: ${gene.gene_id.substring(0, 40)}...\n`;
      insight += `- 关系: ${gene.relationship}\n\n`;
    } else {
      insight += `⚠️ **缺少知识基础**: 无 Gene\n\n`;
    }

    if (analysis.relationships.length > 0) {
      insight += `**关系**:\n`;
      analysis.relationships.forEach(rel => {
        insight += `- ${rel.type}: ${rel.description}\n`;
      });
      insight += `\n`;
    }
  });

  // 模式总结
  insight += `## 🔍 发现的模式\n\n`;

  const withGenes = successful.filter(a => a.genes.length > 0);
  const withoutGenes = successful.filter(a => a.genes.length === 0);

  insight += `### 模式 1: 有知识基础的技能 (${withGenes.length})\n\n`;
  if (withGenes.length > 0) {
    withGenes.forEach(analysis => {
      insight += `- **${analysis.asset.name}**: ✅ 有 Gene → Capsule\n`;
      insight += `  - 理论完整，实现有据\n`;
      insight += `  - 可理解性强\n`;
      insight += `  - 易于维护和进化\n\n`;
    });
  }

  insight += `### 模式 2: 无知识基础的技能 (${withoutGenes.length})\n\n`;
  if (withoutGenes.length > 0) {
    withoutGenes.forEach(analysis => {
      insight += `- **${analysis.asset.name}**: ⚠️ 无 Gene → Capsule\n`;
      insight += `  - 纯实践实现\n`;
      insight += `  - 理论基础缺失\n`;
      insight += `  - 建议: 提取知识形成 Gene\n\n`;
    });
  }

  // 学习要点
  insight += `## 📚 关键学习要点\n\n`;

  insight += `### 1. 知识是技能的灵魂\n`;
  insight += `- Gene 定义了技能的理论基础\n`;
  insight += `- 没有 Gene 的技能缺少理论支撑\n`;
  insight += `- 好的技能应该有明确的知识基础\n\n`;

  insight += `### 2. 技能是知识的表现\n`;
  insight += `- Capsule 实现了 Gene 的理论\n`;
  insight += `- 触发信号定义了技能的应用场景\n`;
  insight += `- blast_radius 定义了技能的影响范围\n\n`;

  insight += `### 3. 组装关系的重要性\n`;
  insight += `- Gene → Capsule 是单向依赖\n`;
  insight += `- 一个 Gene 可以支撑多个 Capsule\n`;
  insight += `- Capsule 不应该独立于 Gene 存在\n\n`;

  // 实践建议
  insight += `## 💡 实践建议\n\n`;

  insight += `### 对于技能开发\n`;
  insight += `1. **先写 Gene** (定义知识)\n`;
  insight += `   - 明确"是什么"和"为什么"\n`;
  insight += `   - 描述策略和方法\n`;
  insight += `   - 定义应用场景\n\n`;

  insight += `2. **再写 Capsule** (实现技能)\n`;
  insight += `   - 引用 Gene 作为基础\n`;
  insight += `   - 实现具体的执行逻辑\n`;
  insight += `   - 定义触发条件\n`;
  insight += `   - 指定影响范围\n\n`;

  insight += `3. **验证关系**\n`;
  insight += `   - 确保 Capsule 引用 Gene\n`;
  insight += `   - 检查 Gene 的完整性\n`;
  insight += `   - 验证理论的正确性\n\n`;

  // 与我们系统的对比
  insight += `## 🔄 与 PCEC 系统的对比\n\n`;

  insight += `### 我们已发布的资产 ✅\n`;
  insight += `- Gene: \`gene_pcec_multi_agent_collaboration\`\n`;
  insight += `- Capsule: \`capsule_pcec_multi_agent_collaboration_20250224\`\n`;
  insight += `- Event: \`evt_pcec_multi_agent_collaboration_20250224\`\n\n`;
  insight += `**我们的实践** ✨:\n`;
  insight += `1. 先定义 Gene (多智能体协作理论)\n`;
  insight += `2. 再实现 Capsule (协作实施方案)\n`;
  insight += `3. 最后记录 Event (进化历程)\n\n`;

  insight += `### 需要改进的地方 ⚠️\n`;
  insight += `- 更多实践: 需要创建更多 Gene-Capsule 对\n`;
  insight += `- 知识验证: 需要验证 Gene 的质量\n`;
  insight += `- 技能优化: 需要基于反馈改进 Capsule\n\n`;

  // 进化方向
  insight += `## 🚀 进化方向\n\n`;

  insight += `### Phase 1: 知识提取\n`;
  insight += `- 从实践中提取知识\n`;
  insight += `- 形成系统化的 Genes\n`;
  insight += `- 建立知识库\n\n`;

  insight += `### Phase 2: 技能生成\n`;
  insight += `- 基于 Gene 生成 Capsule\n`;
  insight += `- 自动化技能生成\n`;
  insight += `- 批量创建技能\n\n`;

  insight += `### Phase 3: 知识进化\n`;
  insight += `- 从实践中学习\n`;
  insight += `- 更新 Gene 内容\n`;
  insight += `- 优化 Capsule 实现\n`;
  insight += `- 持续进化\n\n`;

  insight += `---\n\n`;
  insight += `*本报告由 PCEC Gene-Capsule 分析系统生成*\n`;

  return insight;
}

async function main() {
  console.log('🧬 PCEC Gene-Capsule 关系分析系统 v1.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('目标: 理解知识 (Gene) 如何组装生成技能 (Capsule)\n');

  ensureDir(CONFIG.outputDir);

  const allAnalyses = [];

  // 分析每个目标资产
  for (const asset of CONFIG.targetAssets) {
    const analysis = await analyzeAssetGeneCapsule(asset);
    allAnalyses.push(analysis);

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 保存分析结果
  const resultsPath = path.join(CONFIG.outputDir, 'gene-capsule-analyses.json');
  fs.writeFileSync(resultsPath, JSON.stringify(allAnalyses, null, 2));
  console.log(`\n💾 分析结果已保存: ${resultsPath}`);

  // 生成洞察报告
  const insight = generateGeneCapsuleInsight(allAnalyses);
  const insightPath = path.join(CONFIG.outputDir, 'gene-capsule-insight.md');
  fs.writeFileSync(insightPath, insight);
  console.log(`📄 洞察报告已保存: ${insightPath}`);

  // 输出总结
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('✅ Gene-Capsule 关系分析完成');
  console.log(`${'='.repeat(80)}`);

  const successful = allAnalyses.filter(a => a.found && !a.error);
  const withGenes = successful.filter(a => a.genes.length > 0);

  console.log(`\n📊 分析统计:`);
  console.log(`   分析资产: ${allAnalyses.length}`);
  console.log(`   成功分析: ${successful.length}`);
  console.log(`   有知识基础: ${withGenes.length}`);

  if (withGenes.length > 0) {
    console.log(`\n✅ 有 Gene 的技能 (理想模式):`);
    withGenes.forEach((analysis, i) => {
      console.log(`   ${i + 1}. ${analysis.asset.name}`);
      console.log(`      Gene: ${analysis.genes[0].gene_id.substring(0, 30)}...`);
      console.log(`      Capsule: ${analysis.capsules[0].local_id || analysis.capsules[0].asset_id?.substring(0, 30)}`);
    });
  }

  console.log(`\n💡 核心发现:`);
  console.log(`   1. Gene = 知识元数据 (是什么、为什么)`);
  console.log(`   2. Capsule = 技能能力 (怎么做)`);
  console.log(`   3. 理想模式: Gene → Capsule`);
  console.log(`   4. 技能应该基于知识组装生成\n`);
}

main().catch(console.error);
