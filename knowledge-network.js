#!/usr/bin/env node
/**
 * 知识网络系统 - 智能知识组装与关系挖掘
 *
 * 核心理念:
 * 1. 知识需要判断力 - 不是所有知识都有价值
 * 2. 知识需要关联 - 挖掘潜在关系和模式
 * 3. 知识需要组装 - 组合成实际能力
 * 4. 知识需要网络 - 构建智能知识图谱
 */

const fs = require('fs');
const path = require('path');

process.env.A2A_HUB_URL = 'https://evomap.ai';
process.env.NODE_ID = 'node_514d17ec9eaa04a4';

const { hubSearch } = require('./evolver-main/src/gep/hubSearch');

const CONFIG = {
  outputDir: path.join(__dirname, 'knowledge-base', 'knowledge-network'),
  // 知识价值判断标准
  valueCriteria: {
    minScore: 3.0,           // 最低评分
    minStreak: 5,            // 最低成功记录
    minConfidence: 0.75,     // 最低置信度
    relevance: 'high'        // 相关性要求
  }
};

// ==================== 知识价值判断系统 ====================

class KnowledgeJudge {
  constructor(criteria) {
    this.criteria = criteria;
  }

  /**
   * 判断知识是否有价值
   * 综合多个维度进行评估
   */
  judge(asset) {
    const scores = {
      quality: this.judgeQuality(asset),
      relevance: this.judgeRelevance(asset),
      uniqueness: this.judgeUniqueness(asset),
      applicability: this.judgeApplicability(asset),
      maturity: this.judgeMaturity(asset)
    };

    // 加权总分
    const totalScore =
      scores.quality * 0.30 +
      scores.relevance * 0.25 +
      scores.uniqueness * 0.15 +
      scores.applicability * 0.20 +
      scores.maturity * 0.10;

    const verdict = {
      valuable: totalScore >= 0.6,
      totalScore: Math.round(totalScore * 1000) / 1000,
      scores,
      reasons: []
    };

    // 生成判断理由
    if (scores.quality >= 0.8) verdict.reasons.push('✅ 顶级质量');
    if (scores.relevance >= 0.8) verdict.reasons.push('✅ 高度相关');
    if (scores.uniqueness >= 0.8) verdict.reasons.push('✅ 独特价值');
    if (scores.applicability >= 0.8) verdict.reasons.push('✅ 易于应用');
    if (scores.maturity >= 0.8) verdict.reasons.push('✅ 成熟稳定');

    if (!verdict.valuable) {
      if (scores.quality < 0.5) verdict.reasons.push('❌ 质量不足');
      if (scores.relevance < 0.5) verdict.reasons.push('❌ 相关性低');
      if (scores.uniqueness < 0.5) verdict.reasons.push('❌ 缺乏独特性');
      if (scores.applicability < 0.5) verdict.reasons.push('❌ 难以应用');
    }

    return verdict;
  }

  /**
   * 评估质量 - 基于评分、置信度、成功记录
   */
  judgeQuality(asset) {
    const score = asset.score || 0;
    const confidence = asset.confidence || 0;
    const streak = asset.success_streak || 0;

    // 归一化评分 (假设最高 10)
    const normalizedScore = Math.min(score / 10, 1);

    // 质量分数 = 评分 * 0.5 + 置信度 * 0.3 + 成功记录贡献 * 0.2
    const streakBonus = Math.min(streak / 20, 1); // 20次成功为满分
    const qualityScore =
      normalizedScore * 0.5 +
      confidence * 0.3 +
      streakBonus * 0.2;

    return qualityScore;
  }

  /**
   * 评估相关性 - 基于信号匹配和类别
   */
  judgeRelevance(asset) {
    const signals = asset.signals_match || [];
    const category = asset.category || '';

    // 相关信号集合
    const relevantSignals = [
      'watchdog', 'lifecycle', 'monitor', 'health_check', 'recovery',
      'automation', 'loop', 'evolve', 'continuous',
      'knowledge', 'semantic', 'memory', 'rag',
      'multi_agent', 'collaboration', 'coordination'
    ];

    // 计算相关信号比例
    const relevantCount = signals.filter(s =>
      relevantSignals.some(rs => s.includes(rs))
    ).length;

    const signalScore = signals.length > 0
      ? relevantCount / signals.length
      : 0;

    // 相关类别
    const relevantCategories = ['robust', 'innovate', 'automation', 'monitor'];
    const categoryScore = relevantCategories.includes(category) ? 1 : 0.5;

    return signalScore * 0.7 + categoryScore * 0.3;
  }

  /**
   * 评估独特性 - 基于信号组合的创新程度
   */
  judgeUniqueness(asset) {
    const signals = asset.signals_match || [];

    // 稀有信号（不常见但有价值）
    const rareSignals = [
      'lifecycle_watchdog', 'cascade_recovery', 'semantic_memory',
      'multi_agent_coordination', 'adaptive_evolution'
    ];

    const hasRareSignal = signals.some(s =>
      rareSignals.some(rs => s.includes(rs))
    );

    // 信号组合的独特性
    const uniqueCombos = [
      ['watchdog', 'automation'],
      ['lifecycle', 'recovery'],
      ['semantic', 'memory'],
      ['multi_agent', 'swarm']
    ];

    const hasUniqueCombo = uniqueCombos.some(combo =>
      combo.every(signal => signals.includes(signal))
    );

    if (hasRareSignal) return 1.0;
    if (hasUniqueCombo) return 0.8;
    return 0.5;
  }

  /**
   * 评估可应用性 - 基于复杂度和依赖
   */
  judgeApplicability(asset) {
    // 简化判断：基于类别和信号
    const category = asset.category || '';
    const signals = asset.signals_match || [];

    // 容易应用的类别
    const easyCategories = ['robust', 'automation', 'monitor'];
    const categoryScore = easyCategories.includes(category) ? 1 : 0.6;

    // 复杂信号降低可应用性
    const complexSignals = ['multi_agent', 'distributed', 'consensus'];
    const complexityPenalty = signals.filter(s =>
      complexSignals.some(cs => s.includes(cs))
    ).length * 0.1;

    return Math.max(categoryScore - complexityPenalty, 0.3);
  }

  /**
   * 评估成熟度 - 基于成功记录和来源
   */
  judgeMaturity(asset) {
    const streak = asset.success_streak || 0;
    const sourceNode = asset.source_node_id || '';

    // 成功记录越多越成熟
    const streakScore = Math.min(streak / 15, 1);

    // 专家节点的资产更成熟
    const expertNodes = [
      'node_openclaw',
      'node_xiazi'
    ];
    const sourceBonus = expertNodes.some(node =>
      sourceNode.includes(node)
    ) ? 0.2 : 0;

    return Math.min(streakScore + sourceBonus, 1);
  }
}

// ==================== 知识关系挖掘系统 ====================

class KnowledgeMiner {
  /**
   * 挖掘知识之间的潜在关系
   */
  mineRelationships(assets) {
    const relationships = {
      complementary: [],      // 互补关系
      evolutionary: [],       // 进化关系
      competitive: [],        // 竞争关系
      foundational: [],       // 基础关系
      synergistic: []         // 协同关系
    };

    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const a = assets[i];
        const b = assets[j];

        const rel = this.analyzeRelationship(a, b);
        if (rel) {
          relationships[rel.type].push({
            asset1: a.asset_id,
            asset2: b.asset_id,
            strength: rel.strength,
            reason: rel.reason
          });
        }
      }
    }

    return relationships;
  }

  /**
   * 分析两个资产之间的关系
   */
  analyzeRelationship(assetA, assetB) {
    const signalsA = new Set(assetA.signals_match || []);
    const signalsB = new Set(assetB.signals_match || []);

    // 1. 互补关系 - 覆盖不同领域但可以组合
    const intersection = [...signalsA].filter(s => signalsB.has(s));
    const union = new Set([...signalsA, ...signalsB]);
    const overlap = intersection.length / union.size;

    if (overlap > 0 && overlap < 0.4) {
      return {
        type: 'complementary',
        strength: 0.6,
        reason: `覆盖不同但相关的领域: ${[...signalsA].slice(0, 2).join(', ')} + ${[...signalsB].slice(0, 2).join(', ')}`
      };
    }

    // 2. 进化关系 - 一个是另一个的改进版本
    if (this.isEvolutionary(assetA, assetB)) {
      return {
        type: 'evolutionary',
        strength: 0.8,
        reason: '可能存在进化关系（相同领域，更高评分）'
      };
    }

    // 3. 竞争关系 - 覆盖相同领域
    if (overlap >= 0.6) {
      return {
        type: 'competitive',
        strength: overlap,
        reason: `高度重叠的领域 (${Math.round(overlap * 100)}%)`
      };
    }

    // 4. 基础关系 - 一个是另一个的基础
    if (this.isFoundational(assetA, assetB)) {
      return {
        type: 'foundational',
        strength: 0.7,
        reason: '存在基础-高级关系'
      };
    }

    // 5. 协同关系 - 组合后产生更大价值
    if (this.isSynergistic(assetA, assetB)) {
      return {
        type: 'synergistic',
        strength: 0.9,
        reason: '强协同效应：组合后可解决更复杂问题'
      };
    }

    return null;
  }

  isEvolutionary(a, b) {
    const catA = a.category || '';
    const catB = b.category || '';
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;

    return catA === catB && Math.abs(scoreA - scoreB) > 2;
  }

  isFoundational(a, b) {
    const signalsA = a.signals_match || [];
    const signalsB = b.signals_match || [];

    // B 包含 A 的所有信号，并且还有更多
    const setA = new Set(signalsA);
    const setB = new Set(signalsB);

    const aInB = signalsA.every(s => setB.has(s));
    const bHasMore = setB.size > setA.size;

    return aInB && bHasMore;
  }

  isSynergistic(a, b) {
    const signalsA = a.signals_match || [];
    const signalsB = b.signals_match || [];

    // 特定的协同组合
    const synergisticCombos = [
      [
        ['watchdog', 'lifecycle'],
        ['automation', 'loop']
      ],
      [
        ['knowledge', 'semantic'],
        ['retrieval', 'rag']
      ],
      [
        ['multi_agent'],
        ['coordination', 'swarm']
      ]
    ];

    return synergisticCombos.some(combo => {
      const [groupA, groupB] = combo;
      const aMatches = groupA.every(s => signalsA.includes(s));
      const bMatches = groupB.every(s => signalsB.includes(s));
      return aMatches && bMatches;
    });
  }
}

// ==================== 知识组装系统 ====================

class KnowledgeAssembler {
  /**
   * 将相关知识组装成能力模块
   */
  assemble(assets, relationships) {
    const modules = [];

    // 1. 基于互补关系组装
    relationships.complementary.forEach(rel => {
      modules.push({
        type: 'complementary_module',
        assets: [rel.asset1, rel.asset2],
        synergy: rel.strength,
        description: `组合 ${rel.reason}`,
        capability: this.inferCapability([rel.asset1, rel.asset2])
      });
    });

    // 2. 基于协同关系组装
    relationships.synergistic.forEach(rel => {
      modules.push({
        type: 'synergistic_module',
        assets: [rel.asset1, rel.asset2],
        synergy: rel.strength,
        description: `高协同组合: ${rel.reason}`,
        capability: this.inferCapability([rel.asset1, rel.asset2])
      });
    });

    // 3. 基于进化链组装
    const evolutionary = this.buildEvolutionaryChain(assets, relationships.evolutionary);
    if (evolutionary.length > 0) {
      modules.push({
        type: 'evolutionary_chain',
        assets: evolutionary,
        description: '进化链：展示技术演进路径',
        capability: '技术演进理解'
      });
    }

    return modules;
  }

  /**
   * 推断组合后的能力
   */
  inferCapability(assetIds) {
    // 简化实现：基于组合推断新能力
    const capabilities = {
      'watchdog+automation': '自动化生命周期管理',
      'knowledge+retrieval': '智能知识检索',
      'multi_agent+coordination': '分布式协作系统',
      'monitor+recovery': '自愈系统'
    };

    // 这里应该有更复杂的推断逻辑
    return '复合能力';
  }

  /**
   * 构建进化链
   */
  buildEvolutionaryChain(assets, evolutionaryRels) {
    // 简化实现
    return assets.map(a => a.asset_id).slice(0, 3);
  }
}

// ==================== 知识图谱构建系统 ====================

class KnowledgeGraphBuilder {
  /**
   * 构建智能知识图谱
   */
  build(assets, judge, miner, assembler) {
    const graph = {
      nodes: [],
      edges: [],
      modules: [],
      insights: []
    };

    // 1. 过滤有价值的知识
    const valuableAssets = assets.filter(asset => {
      const verdict = judge.judge(asset);
      asset.verdict = verdict;
      return verdict.valuable;
    });

    console.log(`\n📊 知识过滤结果:`);
    console.log(`   原始资产: ${assets.length}`);
    console.log(`   有价值: ${valuableAssets.length}`);
    console.log(`   过滤率: ${Math.round((1 - valuableAssets.length / assets.length) * 100)}%`);

    // 2. 创建节点
    graph.nodes = valuableAssets.map(asset => ({
      id: asset.asset_id,
      label: asset.local_id || asset.asset_id.substring(0, 12),
      type: asset.type,
      category: asset.category,
      score: asset.score,
      confidence: asset.confidence,
      value: asset.verdict.totalScore,
      signals: asset.signals_match || [],
      metadata: {
        source: asset.source_node_id,
        streak: asset.success_streak
      }
    }));

    // 3. 挖掘关系并创建边
    const relationships = miner.mineRelationships(valuableAssets);

    Object.entries(relationships).forEach(([type, rels]) => {
      rels.forEach(rel => {
        graph.edges.push({
          source: rel.asset1,
          target: rel.asset2,
          type,
          strength: rel.strength,
          label: rel.reason
        });
      });
    });

    console.log(`\n🔗 发现的关系:`);
    Object.entries(relationships).forEach(([type, rels]) => {
      if (rels.length > 0) {
        console.log(`   ${type}: ${rels.length} 个`);
      }
    });

    // 4. 组装知识模块
    graph.modules = assembler.assemble(valuableAssets, relationships);

    console.log(`\n🧩 组装的模块: ${graph.modules.length}`);

    // 5. 生成洞察
    graph.insights = this.generateInsights(graph, valuableAssets);

    return graph;
  }

  /**
   * 生成知识洞察
   */
  generateInsights(graph, assets) {
    const insights = [];

    // 1. 识别核心知识
    const highValueAssets = assets.filter(a => a.verdict.totalScore >= 0.8);
    if (highValueAssets.length > 0) {
      insights.push({
        type: 'core_knowledge',
        level: 'high',
        message: `发现 ${highValueAssets.length} 个核心知识点`,
        assets: highValueAssets.map(a => a.asset_id)
      });
    }

    // 2. 识别知识集群
    const clusters = this.identifyClusters(graph);
    clusters.forEach(cluster => {
      insights.push({
        type: 'knowledge_cluster',
        level: 'medium',
        message: `识别知识集群: ${cluster.theme}`,
        size: cluster.assets.length
      });
    });

    // 3. 识别知识缺口
    const gaps = this.identifyGaps(graph);
    gaps.forEach(gap => {
      insights.push({
        type: 'knowledge_gap',
        level: 'info',
        message: `知识缺口: ${gap.area}`,
        suggestion: gap.suggestion
      });
    });

    return insights;
  }

  /**
   * 识别知识集群
   */
  identifyClusters(graph) {
    // 基于信号相似度聚类
    const clusters = [];
    const processed = new Set();

    graph.nodes.forEach(node => {
      if (processed.has(node.id)) return;

      const cluster = { theme: '', assets: [] };
      const theme = node.category || 'unknown';
      cluster.theme = theme;

      // 找到所有相关节点
      graph.nodes.forEach(n => {
        if (n.category === theme) {
          cluster.assets.push(n.id);
          processed.add(n.id);
        }
      });

      if (cluster.assets.length >= 2) {
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  /**
   * 识别知识缺口
   */
  identifyGaps(graph) {
    const gaps = [];
    const allSignals = new Set();

    graph.nodes.forEach(node => {
      (node.signals || []).forEach(s => allSignals.add(s));
    });

    // 期望的信号集合
    const expectedSignals = [
      'testing', 'documentation', 'security',
      'performance', 'scalability'
    ];

    expectedSignals.forEach(signal => {
      const has = [...allSignals].some(s => s.includes(signal));
      if (!has) {
        gaps.push({
          area: signal,
          suggestion: `考虑寻找与 ${signal} 相关的知识`
        });
      }
    });

    return gaps;
  }
}

// ==================== 主系统 ====================

async function main() {
  console.log('🧠 PCEC 知识网络系统 v1.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('目标: 智能判断、关联、组装和构建知识网络\n');

  // 初始化系统组件
  const judge = new KnowledgeJudge(CONFIG.valueCriteria);
  const miner = new KnowledgeMiner();
  const assembler = new KnowledgeAssembler();
  const builder = new KnowledgeGraphBuilder();

  // 从已发现的资产开始
  const discoveredAssets = [
    {
      asset_id: 'sha256:3f57493702df5c7db38a75862c421fab8fc2330c11b84d3ba9a59ee6139485ea',
      local_id: 'capsule_lifecycle_watchdog',
      type: 'Capsule',
      category: 'robust',
      score: 9.24,
      confidence: 0.88,
      success_streak: 21,
      source_node_id: 'node_openclaw_13bf3f1bf5f785b8',
      signals_match: ['watchdog', 'lifecycle', 'monitor', 'loop', 'evolve', 'automation']
    },
    {
      asset_id: 'sha256:f42f2f09fb34774c58fca70a835671bf8f688b159a1859187a709036a1022a40',
      local_id: 'capsule_knowledge_semantic',
      type: 'Capsule',
      category: 'innovate',
      score: 2.5,
      confidence: 1.0,
      success_streak: 5,
      source_node_id: 'node_d16607f94b98',
      signals_match: ['knowledge', 'semantic', 'embed', 'retrieval', 'rag']
    },
    {
      asset_id: 'sha256:d268891d4db7941e3a42f33465ce21778c9e973d511099dbb2c1ee1f3161cad5',
      local_id: 'capsule_enterprise_integration',
      type: 'Capsule',
      category: 'integration',
      score: 2.375,
      confidence: 0.95,
      success_streak: 5,
      source_node_id: 'node_orphan_hub_misattrib',
      signals_match: ['feishu', 'slack', 'webhook', 'notification', 'enterprise']
    },
    {
      asset_id: 'sha256:c41f183ea1dc8921cc2207255d5cb8619b312234b83fa148e7e96ec4b9379172',
      local_id: 'capsule_openclaw_tool',
      type: 'Capsule',
      category: 'automation',
      score: 2.25,
      confidence: 0.9,
      success_streak: 5,
      source_node_id: 'node_orphan_hub_misattrib',
      signals_match: ['openclaw', 'tool', 'automation']
    }
  ];

  console.log(`📚 输入: ${discoveredAssets.length} 个已发现的资产\n`);

  // 构建知识图谱
  const graph = builder.build(discoveredAssets, judge, miner, assembler);

  // 保存知识图谱
  const outputDir = CONFIG.outputDir;
  fs.mkdirSync(outputDir, { recursive: true });

  const graphPath = path.join(outputDir, 'knowledge-graph.json');
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));
  console.log(`\n💾 知识图谱已保存: ${graphPath}`);

  // 生成知识网络报告
  const report = generateNetworkReport(graph);
  const reportPath = path.join(outputDir, 'knowledge-network-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`📄 知识网络报告已保存: ${reportPath}`);

  // 输出关键洞察
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('💡 知识网络洞察');
  console.log(`${'='.repeat(80)}`);

  graph.insights.forEach(insight => {
    const icon = insight.level === 'high' ? '🔥' : insight.level === 'medium' ? '⚡' : '💡';
    console.log(`\n${icon} ${insight.message}`);
    if (insight.suggestion) {
      console.log(`   建议: ${insight.suggestion}`);
    }
  });

  console.log(`\n\n✅ 知识网络构建完成!`);
  console.log(`   有价值知识: ${graph.nodes.length}`);
  console.log(`   知识关系: ${graph.edges.length}`);
  console.log(`   组装模块: ${graph.modules.length}`);
  console.log(`   生成洞察: ${graph.insights.length}`);
  console.log(`   知识库: ${outputDir}\n`);
}

function generateNetworkReport(graph) {
  let report = `# 🧠 PCEC 知识网络报告\n\n`;
  report += `**生成时间**: ${new Date().toISOString()}\n`;
  report += `**节点数**: ${graph.nodes.length}\n`;
  report += `**关系数**: ${graph.edges.length}\n`;
  report += `**模块数**: ${graph.modules.length}\n\n`;
  report += `---\n\n`;

  // 1. 核心知识
  report += `## 🏆 核心知识\n\n`;
  const coreNodes = graph.nodes
    .filter(n => n.value >= 0.8)
    .sort((a, b) => b.value - a.value);

  if (coreNodes.length > 0) {
    coreNodes.forEach((node, i) => {
      report += `### ${i + 1}. ${node.label}\n\n`;
      report += `- **评分**: ${node.score.toFixed(2)}\n`;
      report += `- **价值**: ${(node.value * 100).toFixed(1)}%\n`;
      report += `- **类别**: ${node.category}\n`;
      report += `- **置信度**: ${node.confidence}\n`;
      report += `- **信号**: ${node.signals.join(', ')}\n`;
      report += `- **来源**: ${node.metadata.source}\n`;
      if (node.metadata.streak >= 10) {
        report += `- ⭐ **稳定**: ${node.metadata.streak} 次成功\n`;
      }
      report += `\n`;
    });
  } else {
    report += `暂无核心知识\n\n`;
  }

  // 2. 知识关系
  report += `## 🔗 知识关系网络\n\n`;

  const edgeTypes = {};
  graph.edges.forEach(edge => {
    edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1;
  });

  Object.entries(edgeTypes).forEach(([type, count]) => {
    report += `### ${type}\n`;
    report += `- 数量: ${count}\n\n`;
  });

  // 3. 组装模块
  report += `## 🧩 知识组装模块\n\n`;

  if (graph.modules.length > 0) {
    graph.modules.forEach((module, i) => {
      report += `### 模块 ${i + 1}: ${module.type}\n\n`;
      report += `${module.description}\n\n`;
      report += `- **协同度**: ${module.synergy}\n`;
      report += `- **能力**: ${module.capability}\n`;
      report += `- **组件**: ${module.assets.length} 个资产\n\n`;
    });
  } else {
    report += `暂无可组装模块\n\n`;
  }

  // 4. 关系图谱 (文本表示)
  report += `## 📊 关系图谱\n\n`;

  const strongEdges = graph.edges
    .filter(e => e.strength >= 0.7)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10);

  if (strongEdges.length > 0) {
    report += `### 强关系 (strength ≥ 0.7)\n\n`;
    strongEdges.forEach(edge => {
      const id1 = edge.source.substring(0, 12);
      const id2 = edge.target.substring(0, 12);
      report += `- \`${id1}\` ←[${edge.type}]→ \`${id2}\` (${(edge.strength * 100).toFixed(0)}%)\n`;
      report += `  ${edge.label}\n\n`;
    });
  }

  // 5. 洞察和建议
  report += `## 💡 洞察与建议\n\n`;

  graph.insights.forEach(insight => {
    const icon = insight.level === 'high' ? '🔥' : insight.level === 'medium' ? '⚡' : '💡';
    report += `### ${icon} ${insight.type}\n\n`;
    report += `${insight.message}\n\n`;
    if (insight.suggestion) {
      report += `**建议**: ${insight.suggestion}\n\n`;
    }
  });

  report += `---\n\n`;
  report += `*本报告由 PCEC 知识网络系统自动生成*\n`;

  return report;
}

main().catch(console.error);
