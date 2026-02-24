/**
 * UltMemory L2: File System Layer
 * 文件系统层 - 文件系统范式
 * 来源: OpenViking 文件系统范式 + memU 自动分类
 */

import { logger } from '../../utils/logger.js';
import { generateURI, parseURI } from '../../utils/helpers.js';

export class FileSystemLayer {
  constructor(storageLayer, config = {}) {
    this.storage = storageLayer;
    this.config = {
      ...config
    };

    // 文件系统结构
    this.structure = {
      memories: {
        preferences: 'ult://memories/preferences',
        relationships: 'ult://memories/relationships',
        knowledge: 'ult://memories/knowledge',
        context: 'ult://memories/context'
      },
      skills: {
        coding: 'ult://skills/coding',
        analysis: 'ult://skills/analysis',
        communication: 'ult://skills/communication'
      },
      resources: {
        conversations: 'ult://resources/conversations',
        documents: 'ult://resources/documents',
        images: 'ult://resources/images'
      }
    };

    // 符号链接 (交叉引用)
    this.symlinks = new Map();

    // 挂载点 (外部资源)
    this.mountPoints = new Map();

    this.initialized = false;
  }

  /**
   * 初始化文件系统层
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 创建基础目录结构 (使用内部方法避免递归)
      await this._createDirectoryInternal('ult://memories');
      await this._createDirectoryInternal('ult://memories/preferences');
      await this._createDirectoryInternal('ult://memories/relationships');
      await this._createDirectoryInternal('ult://memories/knowledge');
      await this._createDirectoryInternal('ult://memories/context');

      await this._createDirectoryInternal('ult://skills');
      await this._createDirectoryInternal('ult://skills/coding');
      await this._createDirectoryInternal('ult://skills/analysis');
      await this._createDirectoryInternal('ult://skills/communication');

      await this._createDirectoryInternal('ult://resources');
      await this._createDirectoryInternal('ult://resources/conversations');
      await this._createDirectoryInternal('ult://resources/documents');
      await this._createDirectoryInternal('ult://resources/images');

      this.initialized = true;
      logger.success('文件系统层初始化成功');
    } catch (error) {
      logger.error('文件系统层初始化失败', error);
      throw error;
    }
  }

  /**
   * 添加文件 (记忆)
   */
  async addFile(uri, content, metadata = {}) {
    await this.initialize();

    const parsed = parseURI(uri);

    const fileData = {
      uri,
      type: 'file',
      content,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 存储到 L1 存储层
    await this.storage.store(uri, fileData, { tier: 'L1' });

    logger.info('添加文件', { uri, size: content.length });
    return fileData;
  }

  /**
   * 获取文件
   */
  async getFile(uri) {
    await this.initialize();

    // 检查符号链接
    const realURI = this.resolveSymlink(uri);
    const targetURI = realURI || uri;

    const item = await this.storage.retrieve(targetURI);

    if (!item || item.data.type !== 'file') {
      return null;
    }

    return item.data;
  }

  /**
   * 创建目录 (内部方法,不检查初始化)
   */
  async _createDirectoryInternal(uri) {
    const dirData = {
      uri,
      type: 'directory',
      children: [],
      createdAt: Date.now()
    };

    await this.storage.store(uri, dirData, { tier: 'L1' });
    logger.debug('创建目录', { uri });
    return dirData;
  }

  /**
   * 创建目录
   */
  async createDirectory(uri) {
    if (!this.initialized) {
      await this.initialize();
      return; // initialize 已经创建了这个目录
    }

    return await this._createDirectoryInternal(uri);
  }

  /**
   * 列出目录内容
   */
  async listDirectory(uri) {
    await this.initialize();

    const children = [];
    const prefix = uri.endsWith('/') ? uri : uri + '/';

    // 遍历所有存储的项
    // 注意: 这是一个简化实现,实际应该使用索引
    // 这里我们返回已知的子项

    const dir = await this.storage.retrieve(uri);
    if (dir && dir.data && dir.data.type === 'directory') {
      return dir.data.children || [];
    }

    return [];
  }

  /**
   * 递归检索
   */
  async retrieveRecursive(uri, query) {
    await this.initialize();

    const results = [];
    const prefix = uri.endsWith('/') ? uri : uri + '/';

    // 递归搜索所有子项
    // 简化实现: 搜索所有项,然后过滤前缀
    const allItems = await this.storage.retrieve(uri);
    // TODO: 实现完整的递归检索

    return results;
  }

  /**
   * 创建符号链接
   */
  async createSymlink(fromURI, toURI) {
    await this.initialize();

    this.symlinks.set(fromURI, toURI);

    logger.info('创建符号链接', { from: fromURI, to: toURI });
    return true;
  }

  /**
   * 解析符号链接
   */
  resolveSymlink(uri) {
    return this.symlinks.get(uri) || null;
  }

  /**
   * 挂载外部资源
   */
  async mount(uri, source) {
    await this.initialize();

    this.mountPoints.set(uri, {
      uri,
      source,
      mountedAt: Date.now()
    });

    logger.info('挂载资源', { uri, source });
    return true;
  }

  /**
   * 卸载资源
   */
  async unmount(uri) {
    const removed = this.mountPoints.delete(uri);
    if (removed) {
      logger.info('卸载资源', { uri });
    }
    return removed;
  }

  /**
   * 获取挂载的资源
   */
  async getMount(uri) {
    return this.mountPoints.get(uri) || null;
  }

  /**
   * 删除文件或目录
   */
  async delete(uri) {
    await this.initialize();

    // 删除符号链接
    if (this.symlinks.has(uri)) {
      this.symlinks.delete(uri);
    }

    // 删除挂载点
    if (this.mountPoints.has(uri)) {
      this.mountPoints.delete(uri);
    }

    // 删除存储的数据
    await this.storage.delete(uri);

    logger.info('删除', { uri });
    return true;
  }

  /**
   * 移动/重命名
   */
  async move(fromURI, toURI) {
    await this.initialize();

    const item = await this.storage.retrieve(fromURI);
    if (!item) {
      throw new Error(`源路径不存在: ${fromURI}`);
    }

    // 更新 URI
    item.data.uri = toURI;
    item.data.updatedAt = Date.now();

    // 存储到新位置
    await this.storage.store(toURI, item.data, { tier: item.data.tier || 'L1' });

    // 删除旧位置
    await this.storage.delete(fromURI);

    logger.info('移动', { from: fromURI, to: toURI });
    return item.data;
  }

  /**
   * 复制
   */
  async copy(fromURI, toURI) {
    await this.initialize();

    const item = await this.storage.retrieve(fromURI);
    if (!item) {
      throw new Error(`源路径不存在: ${fromURI}`);
    }

    // 创建副本
    const copy = {
      ...item.data,
      uri: toURI,
      copiedFrom: fromURI,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.storage.store(toURI, copy, { tier: item.data.tier || 'L1' });

    logger.info('复制', { from: fromURI, to: toURI });
    return copy;
  }

  /**
   * 更新文件内容
   */
  async updateFile(uri, content, metadata = {}) {
    await this.initialize();

    const item = await this.storage.retrieve(uri);
    if (!item) {
      throw new Error(`文件不存在: ${uri}`);
    }

    const updated = {
      ...item.data,
      content,
      metadata: { ...item.data.metadata, ...metadata },
      updatedAt: Date.now()
    };

    await this.storage.store(uri, updated, { tier: item.data.tier || 'L1' });

    logger.info('更新文件', { uri });
    return updated;
  }

  /**
   * 获取文件统计信息
   */
  async getStats(uri) {
    await this.initialize();

    const item = await this.storage.retrieve(uri);
    if (!item) {
      return null;
    }

    return {
      uri: item.data.uri,
      type: item.data.type,
      size: item.data.content ? item.data.content.length : 0,
      createdAt: item.data.createdAt,
      updatedAt: item.data.updatedAt,
      accessCount: item.accessCount,
      tier: item.tier
    };
  }

  /**
   * 搜索文件
   */
  async search(query, options = {}) {
    await this.initialize();

    const { path = 'ult://', type = null } = options;
    const results = [];

    // 简化实现: 搜索所有项
    // TODO: 实现更高效的搜索

    return results;
  }

  /**
   * 导出文件系统结构
   */
  exportStructure() {
    return {
      structure: this.structure,
      symlinks: Array.from(this.symlinks.entries()),
      mountPoints: Array.from(this.mountPoints.values())
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      symlinks: this.symlinks.size,
      mountPoints: this.mountPoints.size,
      structure: this.structure
    };
  }
}
