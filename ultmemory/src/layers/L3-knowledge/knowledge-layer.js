/**
 * UltMemory L3: Knowledge Layer
 * 知识层 - 向量检索、知识图谱、上下文压缩
 * 来源: OpenViking 递归检索 + LX-PCEC 多维检索
 */

import { logger } from '../../utils/logger.js';
import { vectorizeText, cosineSimilarity, compressContext, calculatePhi } from '../../utils/helpers.js';
import { EntityExtractor } from './entity-extractor.js';

export class KnowledgeLayer {
  constructor(storageLayer, fileSystemLayer, config = {}) {
    this.storage = storageLayer;
    this.fileSystem = fileSystemLayer;
    this.config = {
      vectorSize: config.vectorSize || 128,
      topK: config.topK || 10,
      threshold: config.threshold || 0.5,
      ...config
    };

    // 向量索引
    this.vectorIndex = new Map(); // uri -> vector

    // 知识图谱
    this.knowledgeGraph = {
      nodes: new Map(), // id -> { uri, type, data }
      edges: new Map(), // id -> { from, to, type, weight }
      nodeCounter: 0,
      edgeCounter: 0
    };

    // 实体提取器
    this.entityExtractor = new EntityExtractor();

    this.initialized = false;
  }

  /**
   * 初始化知识层
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 重建向量索引
      await this.rebuildVectorIndex();

      // 重建知识图谱
      await this.rebuildKnowledgeGraph();

      this.initialized = true;
      logger.success('知识层初始化成功', {
        vectors: this.vectorIndex.size,
        nodes: this.knowledgeGraph.nodes.size,
        edges: this.knowledgeGraph.edges.size
      });
    } catch (error) {
      logger.error('知识层初始化失败', error);
      throw error;
    }
  }

  /**
   * 添加知识
   */
  async addKnowledge(uri, content, metadata = {}) {
    await this.initialize();

    // 1. 向量化
    const vector = await this.vectorize(content);

    // 2. 存储
    await this.storage.store(uri, {
      uri,
      content,
      metadata,
      vector,
      phi: this.calculateConsciousness({ content, metadata }),
      createdAt: Date.now()
    }, { tier: metadata.tier || 'L1' });

    // 3. 更新向量索引
    this.vectorIndex.set(uri, vector);

    // 4. 添加到知识图谱
    await this.addToKnowledgeGraph(uri, content, metadata);

    logger.info('添加知识', { uri, phi: metadata.phi });
    return { uri, vector };
  }

  /**
   * 向量化文本
   */
  async vectorize(text) {
    return vectorizeText(text);
  }

  /**
   * 混合检索 (向量 + 全文 + 意识)
   */
  async retrieve(query, options = {}) {
    await this.initialize();

    const {
      topK = this.config.topK,
      minPhi = 0,
      includeConsciousness = true,
      includeVector = true,
      includeFullText = true
    } = options;

    const results = [];

    // 1. 向量检索
    if (includeVector) {
      const vectorResults = await this.vectorSearch(query, topK * 2);
      results.push(...vectorResults);
    }

    // 2. 全文检索 (简化版)
    if (includeFullText) {
      const ftsResults = await this.fullTextSearch(query, topK);
      results.push(...ftsResults);
    }

    // 3. 去重和合并
    const merged = this.mergeResults(results);

    // 4. 意识过滤
    let filtered = merged;
    if (includeConsciousness && minPhi > 0) {
      filtered = merged.filter(r => r.phi >= minPhi);
    }

    // 5. 重排序
    const reranked = await this.rerank(query, filtered);

    // 6. Top-K
    return reranked.slice(0, topK);
  }

  /**
   * 向量检索
   */
  async vectorSearch(query, topK = 10) {
    await this.initialize();

    const queryVector = await this.vectorize(query);
    const results = [];

    // 计算相似度
    for (const [uri, vector] of this.vectorIndex.entries()) {
      const similarity = cosineSimilarity(queryVector, vector);

      if (similarity >= this.config.threshold) {
        results.push({
          uri,
          similarity,
          type: 'vector'
        });
      }
    }

    // 排序并返回 Top-K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * 全文检索
   */
  async fullTextSearch(query, topK = 10) {
    await this.initialize();

    const results = [];
    const queryLower = query.toLowerCase();

    // 简化实现: 遍历所有项
    for (const [uri, vector] of this.vectorIndex.entries()) {
      const item = await this.storage.retrieve(uri);
      if (!item || !item.data) {
        continue;
      }

      const content = (item.data.content || '').toLowerCase();
      const metadata = JSON.stringify(item.data.metadata || {}).toLowerCase();

      // 计算匹配分数
      let score = 0;
      const queryWords = queryLower.split(/\s+/);

      for (const word of queryWords) {
        if (content.includes(word)) {
          score += 1;
        }
        if (metadata.includes(word)) {
          score += 0.5;
        }
      }

      if (score > 0) {
        results.push({
          uri,
          similarity: score, // 用 similarity 字段统一
          type: 'fulltext',
          phi: item.data.phi || 0
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * 合并结果
   */
  mergeResults(results) {
    const merged = new Map();

    for (const result of results) {
      const existing = merged.get(result.uri);

      if (existing) {
        // 合并相似度
        existing.similarity = Math.max(existing.similarity, result.similarity);
        existing.types = existing.types || [existing.type];
        if (!existing.types.includes(result.type)) {
          existing.types.push(result.type);
        }
      } else {
        merged.set(result.uri, { ...result });
      }
    }

    return Array.from(merged.values());
  }

  /**
   * 重排序 (基于 LLM 的简化版)
   */
  async rerank(query, results) {
    // 简化实现: 基于多个因素排序
    return results.sort((a, b) => {
      // 1. 相似度权重
      let scoreA = a.similarity;
      let scoreB = b.similarity;

      // 2. 意识水平权重
      if (a.phi) {
        scoreA *= (1 + a.phi * 0.2);
      }
      if (b.phi) {
        scoreB *= (1 + b.phi * 0.2);
      }

      // 3. 多类型匹配加分
      if (a.types && a.types.length > 1) {
        scoreA *= 1.1;
      }
      if (b.types && b.types.length > 1) {
        scoreB *= 1.1;
      }

      return scoreB - scoreA;
    });
  }

  /**
   * 压缩上下文
   */
  async compressContext(uris) {
    await this.initialize();

    const items = [];
    for (const uri of uris) {
      const item = await this.storage.retrieve(uri);
      if (item && item.data) {
        items.push(item.data);
      }
    }

    return compressContext(items);
  }

  /**
   * 计算意识水平 (Phi 值)
   */
  calculateConsciousness(data) {
    // 简化的 IIT 计算
    const systemState = {
      probabilities: this.generateProbabilities(data),
      parts: this.extractParts(data)
    };

    return calculatePhi(systemState);
  }

  /**
   * 生成概率分布 (简化)
   */
  generateProbabilities(data) {
    // 基于内容生成概率分布
    const content = data.content || '';
    const words = content.split(/\s+/);
    const freq = {};

    for (const word of words) {
      if (word.length > 2) {
        freq[word] = (freq[word] || 0) + 1;
      }
    }

    const total = Object.values(freq).reduce((sum, val) => sum + val, 0);
    return Object.values(freq).map(count => count / total);
  }

  /**
   * 提取部分 (简化)
   */
  extractParts(data) {
    // 将数据分解为独立部分
    const parts = [];

    if (data.content) {
      const sentences = data.content.split(/[.!?。！？]/);
      for (const sentence of sentences) {
        if (sentence.trim().length > 0) {
          parts.push({
            probabilities: this.generateProbabilities({ content: sentence })
          });
        }
      }
    }

    return parts;
  }

  /**
   * 添加到知识图谱
   */
  async addToKnowledgeGraph(uri, content, metadata) {
    const nodeId = this.knowledgeGraph.nodeCounter++;

    // 创建节点
    this.knowledgeGraph.nodes.set(nodeId, {
      id: nodeId,
      uri,
      type: metadata.type || 'knowledge',
      data: { content, metadata }
    });

    // 提取实体和关系 (简化)
    await this.extractRelations(nodeId, content, metadata);
  }

  /**
   * 提取关系
   */
  async extractRelations(nodeId, content, metadata) {
    // 使用实体提取器
    const entities = this.entityExtractor.extractEntities(content);
    const relations = this.entityExtractor.extractRelations(content, entities);

    // 创建实体关系
    for (const relation of relations) {
      // 查找或创建目标节点
      let targetNodeId = this.findNodeByName(relation.to);

      if (!targetNodeId) {
        // 创建新节点
        targetNodeId = this.knowledgeGraph.nodeCounter++;
        this.knowledgeGraph.nodes.set(targetNodeId, {
          id: targetNodeId,
          name: relation.to,
          type: this.getEntityType(relation.type),
          data: { entities: [relation.to] }
        });
      }

      // 创建关系边
      const sourceNodeId = this.findNodeByName(relation.from);
      if (sourceNodeId) {
        const edgeId = this.knowledgeGraph.edgeCounter++;
        this.knowledgeGraph.edges.set(edgeId, {
          id: edgeId,
          from: sourceNodeId,
          to: targetNodeId,
          type: relation.type,
          weight: relation.confidence
        });
      }
    }

    // 关键词匹配 (备用方案)
    const keywords = this.entityExtractor.extractKeywords(content, 5);

    for (const { word: keyword } of keywords) {
      for (const [existingId, node] of this.knowledgeGraph.nodes.entries()) {
        if (existingId === nodeId) {
          continue;
        }

        const existingContent = (node.data.content || '').toLowerCase();
        if (existingContent.includes(keyword.toLowerCase())) {
          // 检查是否已存在关系
          const existingEdge = this.findEdge(nodeId, existingId);
          if (!existingEdge) {
            const edgeId = this.knowledgeGraph.edgeCounter++;
            this.knowledgeGraph.edges.set(edgeId, {
              id: edgeId,
              from: nodeId,
              to: existingId,
              type: 'keyword_match',
              weight: 0.5,
              keyword
            });
          }
        }
      }
    }
  }

  /**
   * 根据名称查找节点
   */
  findNodeByName(name) {
    for (const node of this.knowledgeGraph.nodes.values()) {
      if (node.name === name || node.data.content?.includes(name)) {
        return node.id;
      }
    }
    return null;
  }

  /**
   * 查找边
   */
  findEdge(fromId, toId) {
    for (const edge of this.knowledgeGraph.edges.values()) {
      if (edge.from === fromId && edge.to === toId) {
        return edge;
      }
    }
    return null;
  }

  /**
   * 获取实体类型
   */
  getEntityType(relationType) {
    const typeMap = {
      'uses': 'technology',
      'works_at': 'organization',
      'located_in': 'location'
    };
    return typeMap[relationType] || 'entity';
  }

  /**
   * 提取关键词
   */
  extractKeywords(content) {
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);

    const wordFreq = {};
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * 知识图谱推理
   */
  async reason(startURI, depth = 2) {
    await this.initialize();

    const startNode = this.findNodeByURI(startURI);
    if (!startNode) {
      return [];
    }

    const results = [];
    const visited = new Set();
    const queue = [{ node: startNode, currentDepth: 0 }];

    while (queue.length > 0) {
      const { node, currentDepth } = queue.shift();

      if (currentDepth > depth || visited.has(node.id)) {
        continue;
      }

      visited.add(node.id);
      results.push(node);

      // 查找相关节点
      const relatedEdges = this.findEdgesByNode(node.id);
      for (const edge of relatedEdges) {
        const relatedNode = this.knowledgeGraph.nodes.get(edge.to);
        if (relatedNode && !visited.has(relatedNode.id)) {
          queue.push({ node: relatedNode, currentDepth: currentDepth + 1 });
        }
      }
    }

    return results;
  }

  /**
   * 根据 URI 查找节点
   */
  findNodeByURI(uri) {
    for (const node of this.knowledgeGraph.nodes.values()) {
      if (node.uri === uri) {
        return node;
      }
    }
    return null;
  }

  /**
   * 查找节点的边
   */
  findEdgesByNode(nodeId) {
    const edges = [];
    for (const edge of this.knowledgeGraph.edges.values()) {
      if (edge.from === nodeId || edge.to === nodeId) {
        edges.push(edge);
      }
    }
    return edges;
  }

  /**
   * 重建向量索引
   */
  async rebuildVectorIndex() {
    this.vectorIndex.clear();

    // TODO: 遍历所有存储的项,重建索引
    // 这里简化为空,实际应该从存储中加载
  }

  /**
   * 重建知识图谱
   */
  async rebuildKnowledgeGraph() {
    this.knowledgeGraph.nodes.clear();
    this.knowledgeGraph.edges.clear();
    this.knowledgeGraph.nodeCounter = 0;
    this.knowledgeGraph.edgeCounter = 0;

    // TODO: 从存储中重建图谱
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      vectors: this.vectorIndex.size,
      nodes: this.knowledgeGraph.nodes.size,
      edges: this.knowledgeGraph.edges.size
    };
  }
}
