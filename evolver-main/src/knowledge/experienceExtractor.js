/**
 * PCEC 经验提取器
 * 从进化资产中自动提取经验知识
 */

const fs = require('fs');
const path = require('path');
const { createKnowledgeBase } = require('./knowledgeBase');

/**
 * 经验提取器
 */
class ExperienceExtractor {
  constructor(options = {}) {
    this.kb = createKnowledgeBase(options);
    this.assetsDir = options.assetsDir || path.join(process.cwd(), 'assets/gep');
  }

  /**
   * 扫描资产目录
   * @returns {Array} 资产文件列表
   */
  scanAssets() {
    const assets = [];

    // 扫描 genes
    const genesDir = path.join(this.assetsDir, 'genes');
    if (fs.existsSync(genesDir)) {
      const files = fs.readdirSync(genesDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        assets.push({
          type: 'gene',
          path: path.join(genesDir, f)
        });
      });
    }

    // 扫描 capsules
    const capsulesDir = path.join(this.assetsDir, 'capsules');
    if (fs.existsSync(capsulesDir)) {
      const files = fs.readdirSync(capsulesDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        assets.push({
          type: 'capsule',
          path: path.join(capsulesDir, f)
        });
      });
    }

    // 扫描 events
    const eventsDir = path.join(this.assetsDir, 'events');
    if (fs.existsSync(eventsDir)) {
      const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));
      files.forEach(f => {
        assets.push({
          type: 'event',
          path: path.join(eventsDir, f)
        });
      });
    }

    return assets;
  }

  /**
   * 从 Gene 提取经验
   * @param {Object} gene - Gene 对象
   * @returns {Object} 经验项
   */
  extractFromGene(gene) {
    return {
      type: 'lesson',
      title: `策略: ${gene.summary || gene.id}`,
      content: this.formatGeneContent(gene),
      tags: this.extractTags(gene, 'gene'),
      category: 'strategy',
      metadata: {
        gene_id: gene.id,
        category: gene.category,
        signals_match: gene.signals_match,
        strategy_count: gene.strategy?.length || 0
      },
      references: [gene.id]
    };
  }

  /**
   * 从 Capsule 提取经验
   * @param {Object} capsule - Capsule 对象
   * @returns {Object} 经验项
   */
  extractFromCapsule(capsule) {
    return {
      type: 'solution',
      title: `解决方案: ${capsule.summary || capsule.id}`,
      content: this.formatCapsuleContent(capsule),
      tags: this.extractTags(capsule, 'capsule'),
      category: 'solution',
      metadata: {
        capsule_id: capsule.id,
        confidence: capsule.confidence,
        blast_radius: capsule.blast_radius,
        success_streak: capsule.success_streak
      },
      references: [capsule.id, capsule.gene]
    };
  }

  /**
   * 从 EvolutionEvent 提取经验
   * @param {Object} event - EvolutionEvent 对象
   * @returns {Object} 经验项
   */
  extractFromEvent(event) {
    return {
      type: 'pattern',
      title: `进化模式: ${event.intent || event.id}`,
      content: this.formatEventContent(event),
      tags: this.extractTags(event, 'event'),
      category: 'pattern',
      metadata: {
        event_id: event.id,
        intent: event.intent,
        mutations_tried: event.mutations_tried,
        total_cycles: event.total_cycles,
        outcome_score: event.outcome?.score
      },
      references: [event.id, ...(event.genes_used || [])]
    };
  }

  /**
   * 格式化 Gene 内容
   */
  formatGeneContent(gene) {
    const lines = [];

    lines.push('## 策略描述');
    lines.push(gene.summary || '无描述');
    lines.push('');

    lines.push('## 触发信号');
    if (gene.signals_match && gene.signals_match.length > 0) {
      gene.signals_match.forEach(signal => {
        lines.push(`- ${signal}`);
      });
    }
    lines.push('');

    lines.push('## 策略步骤');
    if (gene.strategy && gene.strategy.length > 0) {
      gene.strategy.forEach((step, i) => {
        lines.push(`${i + 1}. ${step}`);
      });
    }
    lines.push('');

    lines.push('## 前置条件');
    if (gene.preconditions && gene.preconditions.length > 0) {
      gene.preconditions.forEach(cond => {
        lines.push(`- ${cond}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * 格式化 Capsule 内容
   */
  formatCapsuleContent(capsule) {
    const lines = [];

    lines.push('## 问题描述');
    if (capsule.trigger && capsule.trigger.length > 0) {
      capsule.trigger.forEach(trigger => {
        lines.push(`- ${trigger}`);
      });
    }
    lines.push('');

    lines.push('## 解决方案');
    if (capsule.content) {
      // 提取关键内容（前 500 字符）
      const preview = capsule.content.substring(0, 500);
      lines.push(preview);
      if (capsule.content.length > 500) {
        lines.push('...');
      }
    } else {
      lines.push(capsule.summary || '无详细内容');
    }
    lines.push('');

    lines.push('## 效果');
    lines.push(`- 置信度: ${capsule.confidence || 'N/A'}`);
    if (capsule.blast_radius) {
      lines.push(`- 影响范围: ${capsule.blast_radius.files} 文件, ${capsule.blast_radius.lines} 行`);
    }
    if (capsule.success_streak) {
      lines.push(`- 成功 streak: ${capsule.success_streak}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化 Event 内容
   */
  formatEventContent(event) {
    const lines = [];

    lines.push('## 进化过程');
    lines.push(`- 意图: ${event.intent || 'unknown'}`);
    lines.push(`- 尝试次数: ${event.mutations_tried || 1}`);
    lines.push(`- 总周期: ${event.total_cycles || 1}`);
    lines.push(`- 结果: ${event.outcome?.status || 'unknown'} (${event.outcome?.score || 'N/A'})`);
    lines.push('');

    lines.push('## 关键洞察');
    if (event.key_insights && event.key_insights.length > 0) {
      event.key_insights.forEach(insight => {
        lines.push(`- ${insight}`);
      });
    }
    lines.push('');

    lines.push('## 经验教训');
    if (event.learnings && event.learnings.length > 0) {
      event.learnings.forEach(learning => {
        lines.push(`- ${learning}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * 提取标签
   */
  extractTags(asset, type) {
    const tags = [type];

    // 从 signals_match 提取
    if (asset.signals_match) {
      tags.push(...asset.signals_match);
    }

    // 从 category 提取
    if (asset.category) {
      tags.push(asset.category);
    }

    // 从 intent 提取
    if (asset.intent) {
      tags.push(asset.intent);
    }

    // 去重
    return [...new Set(tags)];
  }

  /**
   * 提取所有经验
   * @returns {Object} 提取结果
   */
  extractAll() {
    const assets = this.scanAssets();
    const results = {
      total: assets.length,
      processed: 0,
      failed: 0,
      lessons: 0,
      solutions: 0,
      patterns: 0
    };

    console.log(`📚 扫描到 ${assets.length} 个资产`);

    for (const asset of assets) {
      try {
        const content = fs.readFileSync(asset.path, 'utf8');
        const data = JSON.parse(content);

        let knowledgeItem = null;

        if (asset.type === 'gene') {
          knowledgeItem = this.extractFromGene(data);
          results.lessons++;
        } else if (asset.type === 'capsule') {
          knowledgeItem = this.extractFromCapsule(data);
          results.solutions++;
        } else if (asset.type === 'event') {
          knowledgeItem = this.extractFromEvent(data);
          results.patterns++;
        }

        if (knowledgeItem) {
          const id = this.kb.add(knowledgeItem);
          console.log(`   ✅ [${asset.type}] ${knowledgeItem.title} → ${id}`);
        }

        results.processed++;
      } catch (error) {
        console.error(`   ❌ [${asset.type}] ${asset.path}: ${error.message}`);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * 生成知识报告
   * @returns {Object} 知识报告
   */
  generateReport() {
    const stats = this.kb.getStats();

    return {
      summary: stats,
      categories: Object.keys(stats.byCategory).map(cat => ({
        name: cat,
        count: stats.byCategory[cat],
        items: this.kb.getByCategory(cat).slice(0, 5)
      })),
      popularTags: Object.entries(stats.byTag)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      recentItems: this.kb.search({ limit: 10 })
    };
  }
}

/**
 * 创建经验提取器
 * @param {Object} options - 选项
 * @returns {ExperienceExtractor} 提取器实例
 */
function createExtractor(options = {}) {
  return new ExperienceExtractor(options);
}

module.exports = {
  ExperienceExtractor,
  createExtractor
};
