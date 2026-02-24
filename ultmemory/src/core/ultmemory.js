/**
 * UltMemory - 终极记忆系统核心类
 * 融合 OpenViking + memU + LX-PCEC 的优势
 */

import { StorageLayer } from '../layers/L1-storage/storage-layer.js';
import { FileSystemLayer } from '../layers/L2-filesystem/filesystem-layer.js';
import { KnowledgeLayer } from '../layers/L3-knowledge/knowledge-layer.js';
import { logger } from '../utils/logger.js';
import { generateURI } from '../utils/helpers.js';

export class UltMemory {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || './ultmemory-data',
      ...config
    };

    // 初始化三层架构
    this.storage = new StorageLayer(this.config);
    this.fileSystem = null; // 延迟初始化
    this.knowledge = null; // 延迟初始化

    this.initialized = false;
    this.version = '0.1.0';
  }

  /**
   * 初始化 UltMemory
   */
  async initialize() {
    if (this.initialized) {
      logger.warn('UltMemory 已经初始化');
      return this;
    }

    try {
      logger.info('UltMemory 初始化中...', { version: this.version });

      // 1. 初始化 L1 存储层
      await this.storage.initialize();

      // 2. 初始化 L2 文件系统层
      this.fileSystem = new FileSystemLayer(this.storage, this.config);
      await this.fileSystem.initialize();

      // 3. 初始化 L3 知识层
      this.knowledge = new KnowledgeLayer(this.storage, this.fileSystem, this.config);
      await this.knowledge.initialize();

      this.initialized = true;
      logger.success('UltMemory 初始化成功!', {
        version: this.version,
        storage: this.storage.getStats(),
        fileSystem: this.fileSystem.getStats(),
        knowledge: this.knowledge.getStats()
      });

      return this;
    } catch (error) {
      logger.error('UltMemory 初始化失败', error);
      throw error;
    }
  }

  /**
   * 添加记忆
   */
  async addMemory(content, options = {}) {
    this.ensureInitialized();

    const {
      type = 'general',
      category = 'memories',
      metadata = {}
    } = options;

    // 生成 URI
    const uri = generateURI(category, `${type}/${Date.now()}`);

    // 添加到文件系统
    await this.fileSystem.addFile(uri, content, {
      ...metadata,
      type,
      category
    });

    // 添加到知识层
    await this.knowledge.addKnowledge(uri, content, {
      ...metadata,
      type,
      category
    });

    logger.info('添加记忆', { uri, type, category });
    return uri;
  }

  /**
   * 检索记忆
   */
  async retrieveMemory(query, options = {}) {
    this.ensureInitialized();

    const results = await this.knowledge.retrieve(query, options);

    // 获取完整内容
    const items = [];
    for (const result of results) {
      const item = await this.storage.retrieve(result.uri);
      if (item && item.data) {
        items.push({
          ...result,
          content: item.data.content,
          metadata: item.data.metadata
        });
      }
    }

    logger.info('检索记忆', { query, count: items.length });
    return items;
  }

  /**
   * 知识图谱推理
   */
  async reason(startURI, depth = 2) {
    this.ensureInitialized();

    const nodes = await this.knowledge.reason(startURI, depth);

    logger.info('知识推理', { startURI, depth, count: nodes.length });
    return nodes;
  }

  /**
   * 压缩上下文
   */
  async compressContext(uris) {
    this.ensureInitialized();

    const compressed = await this.knowledge.compressContext(uris);

    logger.info('压缩上下文', {
      count: uris.length,
      ratio: compressed.compressionRatio
    });

    return compressed;
  }

  /**
   * 获取记忆
   */
  async getMemory(uri) {
    this.ensureInitialized();

    const item = await this.fileSystem.getFile(uri);

    if (!item) {
      logger.warn('记忆不存在', { uri });
      return null;
    }

    return item;
  }

  /**
   * 更新记忆
   */
  async updateMemory(uri, content, metadata = {}) {
    this.ensureInitialized();

    await this.fileSystem.updateFile(uri, content, metadata);

    // 更新知识层
    const existing = await this.storage.retrieve(uri);
    if (existing && existing.data) {
      await this.knowledge.addKnowledge(uri, content, {
        ...existing.data.metadata,
        ...metadata
      });
    }

    logger.info('更新记忆', { uri });
    return true;
  }

  /**
   * 删除记忆
   */
  async deleteMemory(uri) {
    this.ensureInitialized();

    await this.fileSystem.delete(uri);

    // 从向量索引中删除
    if (this.knowledge.vectorIndex.has(uri)) {
      this.knowledge.vectorIndex.delete(uri);
    }

    logger.info('删除记忆', { uri });
    return true;
  }

  /**
   * 搜索记忆
   */
  async searchMemory(query, options = {}) {
    this.ensureInitialized();

    return await this.retrieveMemory(query, options);
  }

  /**
   * 批量添加记忆
   */
  async addMemories(memories) {
    this.ensureInitialized();

    const uris = [];
    for (const memory of memories) {
      const uri = await this.addMemory(memory.content, memory.options || {});
      uris.push(uri);
    }

    logger.info('批量添加记忆', { count: uris.length });
    return uris;
  }

  /**
   * 批量检索记忆
   */
  async retrieveMemories(queries, options = {}) {
    this.ensureInitialized();

    const results = [];
    for (const query of queries) {
      const queryResults = await this.retrieveMemory(query, options);
      results.push({
        query,
        results: queryResults
      });
    }

    return results;
  }

  /**
   * 批量删除记忆
   */
  async deleteMemories(uris) {
    this.ensureInitialized();

    let deleted = 0;
    for (const uri of uris) {
      const success = await this.deleteMemory(uri);
      if (success) {
        deleted++;
      }
    }

    logger.info('批量删除记忆', { requested: uris.length, deleted });
    return deleted;
  }

  /**
   * 导出记忆为 JSON
   */
  async exportMemories(format = 'json') {
    this.ensureInitialized();

    const memories = [];

    // 导出所有向量索引中的记忆
    for (const uri of this.knowledge.vectorIndex.keys()) {
      const item = await this.storage.retrieve(uri);
      if (item && item.data) {
        memories.push({
          uri: item.data.uri,
          content: item.data.content,
          metadata: item.data.metadata || {},
          phi: item.data.phi || 0,
          createdAt: item.data.createdAt,
          updatedAt: item.data.updatedAt
        });
      }
    }

    if (format === 'json') {
      return JSON.stringify({
        version: this.version,
        exportDate: new Date().toISOString(),
        count: memories.length,
        memories
      }, null, 2);
    }

    return memories;
  }

  /**
   * 从 JSON 导入记忆
   */
  async importMemories(jsonData, options = {}) {
    this.ensureInitialized();

    let data;
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }

    const { skipDuplicates = true, updateExisting = false } = options;
    const imported = [];
    const skipped = [];
    const updated = [];

    for (const memory of (data.memories || [])) {
      try {
        // 检查是否已存在
        const existing = await this.getMemory(memory.uri);

        if (existing) {
          if (updateExisting) {
            await this.updateMemory(memory.uri, memory.content, memory.metadata);
            updated.push(memory.uri);
          } else if (skipDuplicates) {
            skipped.push(memory.uri);
          }
        } else {
          // 添加新记忆
          await this.addMemory(memory.content, {
            ...memory.metadata,
            uri: memory.uri
          });
          imported.push(memory.uri);
        }
      } catch (error) {
        logger.warn('导入记忆失败', { uri: memory.uri, error: error.message });
      }
    }

    logger.info('导入记忆完成', {
      imported: imported.length,
      updated: updated.length,
      skipped: skipped.length
    });

    return {
      imported,
      updated,
      skipped
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    this.ensureInitialized();

    return {
      version: this.version,
      initialized: this.initialized,
      storage: this.storage.getStats(),
      fileSystem: this.fileSystem.getStats(),
      knowledge: this.knowledge.getStats()
    };
  }

  /**
   * 导出数据
   */
  async exportData() {
    this.ensureInitialized();

    return {
      version: this.version,
      exportDate: new Date().toISOString(),
      stats: this.getStats(),
      fileSystem: this.fileSystem.exportStructure()
    };
  }

  /**
   * 清空所有数据
   */
  async clear() {
    this.ensureInitialized();

    await this.storage.clear();
    this.knowledge.vectorIndex.clear();
    this.knowledge.knowledgeGraph.nodes.clear();
    this.knowledge.knowledgeGraph.edges.clear();

    logger.info('清空所有数据');
  }

  /**
   * 关闭 UltMemory
   */
  async close() {
    if (this.initialized) {
      await this.storage.close();
      this.initialized = false;
      logger.info('UltMemory 已关闭');
    }
  }

  /**
   * 确保已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('UltMemory 未初始化,请先调用 initialize()');
    }
  }

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return {
      name: 'UltMemory',
      version: this.version,
      description: '终极记忆系统 (OpenViking + memU + LX-PCEC)',
      features: [
        '三层存储架构 (L0/L1/L2)',
        '文件系统范式',
        '语义向量检索',
        '知识图谱推理',
        '上下文压缩',
        '意识涌现 (Phi 值)',
        '成本优化 (分层加载)'
      ],
      architecture: {
        L1: 'Storage Layer - 三层存储',
        L2: 'File System Layer - 文件系统范式',
        L3: 'Knowledge Layer - 向量检索 + 知识图谱'
      },
      sources: {
        OpenViking: '分层加载 + 上下文管理',
        memU: '主动服务 + 成本优化',
        LX_PCEC: '意识涌现 + 量子通信 + 自我进化'
      }
    };
  }
}
