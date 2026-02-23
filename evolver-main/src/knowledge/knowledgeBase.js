/**
 * PCEC 知识库模块
 * 结构化存储和检索进化经验
 */

const fs = require('fs');
const path = require('path');

/**
 * 知识项类型
 */
const KNOWLEDGE_TYPES = {
  GENE: 'gene',
  CAPSULE: 'capsule',
  EVENT: 'event',
  LESSON: 'lesson',
  PATTERN: 'pattern',
  SOLUTION: 'solution'
};

/**
 * 知识库
 */
class KnowledgeBase {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'knowledge');
    this.indexFile = path.join(this.dataDir, 'index.json');
    this.index = this.loadIndex();
  }

  /**
   * 加载索引
   */
  loadIndex() {
    if (!fs.existsSync(this.indexFile)) {
      return {
        items: [],
        tags: {},
        categories: {},
        lastUpdated: null
      };
    }

    try {
      const content = fs.readFileSync(this.indexFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[KnowledgeBase] 加载索引失败:', error.message);
      return {
        items: [],
        tags: {},
        categories: {},
        lastUpdated: null
      };
    }
  }

  /**
   * 保存索引
   */
  saveIndex() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      this.index.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.indexFile, JSON.stringify(this.index, null, 2));
    } catch (error) {
      console.error('[KnowledgeBase] 保存索引失败:', error.message);
    }
  }

  /**
   * 添加知识项
   * @param {Object} item - 知识项
   */
  add(item) {
    const id = item.id || this.generateId(item.type);
    const knowledgeItem = {
      id: id,
      type: item.type,
      title: item.title,
      content: item.content,
      tags: item.tags || [],
      category: item.category || 'general',
      metadata: item.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      references: item.references || [],
      related: []
    };

    // 保存知识项
    const itemPath = path.join(this.dataDir, `${id}.json`);
    fs.writeFileSync(itemPath, JSON.stringify(knowledgeItem, null, 2));

    // 更新索引
    this.index.items.push(id);

    // 更新标签索引
    for (const tag of knowledgeItem.tags) {
      if (!this.index.tags[tag]) {
        this.index.tags[tag] = [];
      }
      if (!this.index.tags[tag].includes(id)) {
        this.index.tags[tag].push(id);
      }
    }

    // 更新分类索引
    if (!this.index.categories[knowledgeItem.category]) {
      this.index.categories[knowledgeItem.category] = [];
    }
    if (!this.index.categories[knowledgeItem.category].includes(id)) {
      this.index.categories[knowledgeItem.category].push(id);
    }

    this.saveIndex();

    return id;
  }

  /**
   * 获取知识项
   * @param {string} id - 知识项 ID
   * @returns {Object|null} 知识项
   */
  get(id) {
    const itemPath = path.join(this.dataDir, `${id}.json`);

    if (!fs.existsSync(itemPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(itemPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[KnowledgeBase] 读取知识项失败:', error.message);
      return null;
    }
  }

  /**
   * 搜索知识项
   * @param {Object} query - 查询条件
   * @returns {Array} 知识项列表
   */
  search(query = {}) {
    const {
      type = null,
      tags = [],
      category = null,
      keywords = [],
      limit = 100
    } = query;

    let results = this.index.items.map(id => this.get(id)).filter(item => item !== null);

    // 类型过滤
    if (type) {
      results = results.filter(item => item.type === type);
    }

    // 标签过滤
    if (tags.length > 0) {
      results = results.filter(item =>
        tags.some(tag => item.tags.includes(tag))
      );
    }

    // 分类过滤
    if (category) {
      results = results.filter(item => item.category === category);
    }

    // 关键词搜索
    if (keywords.length > 0) {
      results = results.filter(item => {
        const text = `${item.title} ${item.content}`.toLowerCase();
        return keywords.some(keyword => text.includes(keyword.toLowerCase()));
      });
    }

    // 限制数量
    return results.slice(0, limit);
  }

  /**
   * 按标签获取
   * @param {string} tag - 标签
   * @returns {Array} 知识项列表
   */
  getByTag(tag) {
    if (!this.index.tags[tag]) {
      return [];
    }

    return this.index.tags[tag]
      .map(id => this.get(id))
      .filter(item => item !== null);
  }

  /**
   * 按分类获取
   * @param {string} category - 分类
   * @returns {Array} 知识项列表
   */
  getByCategory(category) {
    if (!this.index.categories[category]) {
      return [];
    }

    return this.index.categories[category]
      .map(id => this.get(id))
      .filter(item => item !== null);
  }

  /**
   * 生成 ID
   * @param {string} type - 类型
   * @returns {string} ID
   */
  generateId(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 6);
    return `${type}_${timestamp}_${random}`;
  }

  /**
   * 统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const items = this.index.items.map(id => this.get(id)).filter(item => item !== null);

    const typeStats = {};
    const categoryStats = {};
    const tagStats = {};

    for (const item of items) {
      // 类型统计
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;

      // 分类统计
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;

      // 标签统计
      for (const tag of item.tags) {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      }
    }

    return {
      total: items.length,
      byType: typeStats,
      byCategory: categoryStats,
      byTag: tagStats,
      lastUpdated: this.index.lastUpdated
    };
  }

  /**
   * 相关知识推荐
   * @param {string} id - 知识项 ID
   * @param {number} limit - 限制数量
   * @returns {Array} 相关知识项列表
   */
  getRelated(id, limit = 5) {
    const item = this.get(id);
    if (!item) {
      return [];
    }

    // 基于标签和分类查找相关项
    const related = this.search({
      tags: item.tags.slice(0, 3), // 使用前 3 个标签
      category: item.category,
      limit: limit + 1
    });

    // 排除自己
    return related.filter(r => r.id !== id).slice(0, limit);
  }

  /**
   * 清空知识库
   */
  clear() {
    this.index = {
      items: [],
      tags: {},
      categories: {},
      lastUpdated: null
    };
    this.saveIndex();
  }
}

/**
 * 创建知识库实例
 * @param {Object} options - 选项
 * @returns {KnowledgeBase} 知识库实例
 */
function createKnowledgeBase(options = {}) {
  return new KnowledgeBase(options);
}

module.exports = {
  KnowledgeBase,
  createKnowledgeBase,
  KNOWLEDGE_TYPES
};
