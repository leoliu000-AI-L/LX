/**
 * PCEC 智能检索模块
 * 基于语义相似度的知识检索
 */

const fs = require('fs');
const path = require('path');

/**
 * 简单的文本相似度计算
 * 使用 TF-IDF 和余弦相似度
 */
class SemanticSearch {
  constructor(options = {}) {
    this.kb = options.kb;
    this.index = this.buildIndex();
  }

  /**
   * 构建索引
   */
  buildIndex() {
    const items = this.kb.index.items.map(id => this.kb.get(id)).filter(item => item !== null);

    const index = {
      items: {},
      terms: {},
      documents: {}
    };

    for (const item of items) {
      const docId = item.id;
      const text = `${item.title} ${item.content}`.toLowerCase();

      // 分词
      const terms = this.tokenize(text);

      // 建立文档-词项矩阵
      for (const term of terms) {
        if (!index.terms[term]) {
          index.terms[term] = {};
        }
        if (!index.terms[term][docId]) {
          index.terms[term][docId] = 0;
        }
        index.terms[term][docId]++;
      }

      // 保存文档
      index.documents[docId] = {
        id: item.id,
        title: item.title,
        type: item.type,
        category: item.category,
        tags: item.tags,
        termCount: terms.length
      };
    }

    // 计算 IDF
    const totalDocs = Object.keys(index.documents).length;
    index.idf = {};

    for (const term in index.terms) {
      const docFreq = Object.keys(index.terms[term]).length;
      index.idf[term] = Math.log(totalDocs / (1 + docFreq));
    }

    return index;
  }

  /**
   * 分词
   * @param {string} text - 文本
   * @returns {Array} 词汇列表
   */
  tokenize(text) {
    // 简单分词：按空格、标点符号分割
    return text
      .toLowerCase()
      .split(/[\s\n\r\t,.;:!?"'(){}\[\]<>/\\|`~@#$%^&*\-+=]+/)
      .filter(word => word.length > 2); // 过滤短词
  }

  /**
   * 计算查询向量
   * @param {string} query - 查询文本
   * @returns {Object} TF-IDF 向量
   */
  calculateQueryVector(query) {
    const terms = this.tokenize(query);
    const vector = {};
    const queryTf = {};

    // 计算 TF
    for (const term of terms) {
      queryTf[term] = (queryTf[term] || 0) + 1;
    }

    // 归一化 TF
    const maxTf = Math.max(...Object.values(queryTf));
    for (const term in queryTf) {
      queryTf[term] = 0.5 + 0.5 * (queryTf[term] / maxTf);
    }

    // 计算 TF-IDF
    for (const term of terms) {
      const idf = this.index.idf[term] || 0;
      vector[term] = queryTf[term] * idf;
    }

    return vector;
  }

  /**
   * 计算文档向量
   * @param {string} docId - 文档 ID
   * @returns {Object} TF-IDF 向量
   */
  calculateDocVector(docId) {
    const vector = {};
    const docTerms = this.index.terms;

    for (const term in docTerms) {
      if (docTerms[term][docId]) {
        const tf = docTerms[term][docId];
        const idf = this.index.idf[term] || 0;
        vector[term] = tf * idf;
      }
    }

    return vector;
  }

  /**
   * 计算余弦相似度
   * @param {Object} vec1 - 向量1
   * @param {Object} vec2 - 向量2
   * @returns {number} 相似度 (0-1)
   */
  cosineSimilarity(vec1, vec2) {
    const terms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const term of terms) {
      const v1 = vec1[term] || 0;
      const v2 = vec2[term] || 0;

      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 搜索
   * @param {string} query - 查询文本
   * @param {Object} options - 选项
   * @returns {Array} 搜索结果
   */
  search(query, options = {}) {
    const {
      limit = 10,
      threshold = 0.1,
      type = null,
      category = null
    } = options;

    const queryVector = this.calculateQueryVector(query);
    const results = [];

    // 计算所有文档的相似度
    for (const docId in this.index.documents) {
      const docVector = this.calculateDocVector(docId);
      const similarity = this.cosineSimilarity(queryVector, docVector);

      if (similarity >= threshold) {
        const doc = this.index.documents[docId];

        // 过滤
        if (type && doc.type !== type) continue;
        if (category && doc.category !== category) continue;

        results.push({
          id: docId,
          title: doc.title,
          type: doc.type,
          category: doc.category,
          score: similarity,
          tags: doc.tags
        });
      }
    }

    // 排序并限制数量
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * 推荐相关知识
   * @param {string} itemId - 知识项 ID
   * @param {number} limit - 限制数量
   * @returns {Array} 推荐列表
   */
  recommend(itemId, limit = 5) {
    const item = this.kb.get(itemId);
    if (!item) {
      return [];
    }

    // 使用标题和内容作为查询
    const query = `${item.title} ${item.tags.join(' ')}`;

    return this.search(query, {
      limit: limit + 1,
      threshold: 0.05
    }).filter(r => r.id !== itemId).slice(0, limit);
  }

  /**
   * 热门查询
   * @param {number} limit - 限制数量
   * @returns {Array} 热门知识
   */
  getPopular(limit = 10) {
    const items = Object.values(this.index.documents);

    // 基于标签数量排序（假设标签多意味着被引用多）
    return items
      .sort((a, b) => b.tags.length - a.tags.length)
      .slice(0, limit)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        category: doc.category,
        tagCount: doc.tags.length
      }));
  }
}

/**
 * 创建智能检索实例
 * @param {Object} options - 选项
 * @returns {SemanticSearch} 检索实例
 */
function createSemanticSearch(options = {}) {
  return new SemanticSearch(options);
}

module.exports = {
  SemanticSearch,
  createSemanticSearch
};
