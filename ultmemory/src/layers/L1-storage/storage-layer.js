/**
 * UltMemory L1: Storage Layer
 * 存储层 - 三层存储架构 (L0/L1/L2)
 * 来源: OpenViking 分层加载 + memU 生产级存储
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { generateId, deepClone } from '../../utils/helpers.js';

export class StorageLayer {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || './ultmemory-data',
      L0maxSize: config.L0maxSize || 100, // L0 最大条目数
      L1maxSize: config.L1maxSize || 1000, // L1 最大条目数
      autoMigrate: config.autoMigrate !== false, // 自动分层迁移
      ...config
    };

    // 三层存储
    this.L0 = new Map(); // 热数据 - 内存 (意识状态)
    this.L1 = new Map(); // 温数据 - 文件系统 (工作记忆)
    this.L2Path = path.join(this.config.dataDir, 'L2'); // 冷数据 - 长期记忆

    this.stats = {
      L0hits: 0,
      L1hits: 0,
      L2hits: 0,
      migrations: 0
    };

    this.initialized = false;
  }

  /**
   * 初始化存储层
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // 创建数据目录
      await fs.mkdir(this.config.dataDir, { recursive: true });
      await fs.mkdir(this.L2Path, { recursive: true });

      // 加载 L1 数据
      await this.loadL1();

      this.initialized = true;
      logger.success('存储层初始化成功', {
        dataDir: this.config.dataDir,
        L0size: this.L0.size,
        L1size: this.L1.size
      });
    } catch (error) {
      logger.error('存储层初始化失败', error);
      throw error;
    }
  }

  /**
   * 存储数据
   */
  async store(uri, data, options = {}) {
    await this.initialize();

    const { tier = 'L0', forceTier = null } = options;
    const targetTier = forceTier || tier;

    const item = {
      id: generateId(),
      uri,
      data,
      tier: targetTier,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    };

    switch (targetTier) {
      case 'L0':
        return await this.storeL0(item);
      case 'L1':
        return await this.storeL1(item);
      case 'L2':
        return await this.storeL2(item);
      default:
        throw new Error(`Invalid storage tier: ${targetTier}`);
    }
  }

  /**
   * L0 存储 (热数据 - 内存)
   */
  async storeL0(item) {
    // 检查容量
    if (this.L0.size >= this.config.L0maxSize) {
      // 自动迁移最旧的数据到 L1
      await this.migrateL0toL1();
    }

    this.L0.set(item.uri, item);
    logger.debug('L0 存储', { uri: item.uri, size: this.L0.size });
    return item;
  }

  /**
   * L1 存储 (温数据 - 文件)
   */
  async storeL1(item) {
    const filePath = this.getL1FilePath(item.uri);

    try {
      await fs.writeFile(filePath, JSON.stringify(item, null, 2));
      this.L1.set(item.uri, { ...item, filePath });
      logger.debug('L1 存储', { uri: item.uri, path: filePath });
      return item;
    } catch (error) {
      logger.error('L1 存储失败', { uri: item.uri, error });
      throw error;
    }
  }

  /**
   * L2 存储 (冷数据 - 长期归档)
   */
  async storeL2(item) {
    const filePath = path.join(this.L2Path, `${item.id}.json`);

    try {
      await fs.writeFile(filePath, JSON.stringify(item, null, 2));
      logger.debug('L2 存储', { uri: item.uri, path: filePath });
      return item;
    } catch (error) {
      logger.error('L2 存储失败', { uri: item.uri, error });
      throw error;
    }
  }

  /**
   * 检索数据
   */
  async retrieve(uri) {
    await this.initialize();

    // 1. 先查 L0 (最快)
    if (this.L0.has(uri)) {
      this.stats.L0hits++;
      const item = this.L0.get(uri);
      item.accessedAt = Date.now();
      item.accessCount++;
      return deepClone(item);
    }

    // 2. 查 L1
    if (this.L1.has(uri)) {
      this.stats.L1hits++;
      const item = this.L1.get(uri);
      item.accessedAt = Date.now();
      item.accessCount++;

      // 热数据提升到 L0
      if (item.accessCount > 5 && this.config.autoMigrate) {
        await this.migrateL1toL0(uri);
      }

      return deepClone(item);
    }

    // 3. 查 L2
    const l2Item = await this.retrieveL2(uri);
    if (l2Item) {
      this.stats.L2hits++;
      return l2Item;
    }

    return null;
  }

  /**
   * L2 检索
   */
  async retrieveL2(uri) {
    try {
      const files = await fs.readdir(this.L2Path);
      for (const file of files) {
        const filePath = path.join(this.L2Path, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const item = JSON.parse(content);

        if (item.uri === uri) {
          item.accessedAt = Date.now();
          item.accessCount++;

          // 热数据提升到 L1
          if (item.accessCount > 3 && this.config.autoMigrate) {
            await this.store(uri, item, { forceTier: 'L1' });
          }

          return item;
        }
      }
    } catch (error) {
      logger.debug('L2 检索失败', { uri, error });
    }

    return null;
  }

  /**
   * 删除数据
   */
  async delete(uri) {
    await this.initialize();

    let deleted = false;

    // 删除 L0
    if (this.L0.has(uri)) {
      this.L0.delete(uri);
      deleted = true;
    }

    // 删除 L1
    if (this.L1.has(uri)) {
      const item = this.L1.get(uri);
      if (item.filePath) {
        try {
          await fs.unlink(item.filePath);
        } catch (error) {
          logger.warn('删除 L1 文件失败', { path: item.filePath, error });
        }
      }
      this.L1.delete(uri);
      deleted = true;
    }

    // 删除 L2
    const l2Deleted = await this.deleteL2(uri);
    if (l2Deleted) {
      deleted = true;
    }

    if (deleted) {
      logger.info('删除数据', { uri });
    }

    return deleted;
  }

  /**
   * L2 删除
   */
  async deleteL2(uri) {
    try {
      const files = await fs.readdir(this.L2Path);
      for (const file of files) {
        const filePath = path.join(this.L2Path, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const item = JSON.parse(content);

        if (item.uri === uri) {
          await fs.unlink(filePath);
          return true;
        }
      }
    } catch (error) {
      logger.debug('L2 删除失败', { uri, error });
    }

    return false;
  }

  /**
   * 迁移 L0 -> L1
   */
  async migrateL0toL1() {
    if (this.L0.size === 0) {
      return;
    }

    // 找到最旧的数据
    let oldestURI = null;
    let oldestTime = Infinity;

    for (const [uri, item] of this.L0.entries()) {
      if (item.accessedAt < oldestTime) {
        oldestTime = item.accessedAt;
        oldestURI = uri;
      }
    }

    if (oldestURI) {
      const item = this.L0.get(oldestURI);
      this.L0.delete(oldestURI);
      await this.storeL1({ ...item, tier: 'L1' });
      this.stats.migrations++;
      logger.debug('迁移 L0 -> L1', { uri: oldestURI });
    }
  }

  /**
   * 迁移 L1 -> L0
   */
  async migrateL1toL0(uri) {
    const item = this.L1.get(uri);
    if (!item) {
      return;
    }

    await this.storeL0({ ...item, tier: 'L0' });
    this.stats.migrations++;
    logger.debug('迁移 L1 -> L0', { uri });
  }

  /**
   * 获取 L1 文件路径
   */
  getL1FilePath(uri) {
    const filename = uri.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
    return path.join(this.config.dataDir, 'L1', filename);
  }

  /**
   * 加载 L1 数据
   */
  async loadL1() {
    try {
      const l1Dir = path.join(this.config.dataDir, 'L1');
      await fs.mkdir(l1Dir, { recursive: true });

      const files = await fs.readdir(l1Dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(l1Dir, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (content.trim().length === 0) {
              logger.warn('跳过空文件', { filePath });
              continue;
            }
            const item = JSON.parse(content);
            if (item && item.uri) {
              this.L1.set(item.uri, { ...item, filePath });
            } else {
              logger.warn('跳过无效文件', { filePath });
            }
          } catch (parseError) {
            logger.warn('解析文件失败，跳过', { filePath, error: parseError.message });
          }
        }
      }

      logger.info('L1 数据加载完成', { count: this.L1.size });
    } catch (error) {
      logger.warn('L1 数据加载失败', { error });
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      L0: {
        size: this.L0.size,
        maxSize: this.config.L0maxSize,
        hits: this.stats.L0hits
      },
      L1: {
        size: this.L1.size,
        maxSize: this.config.L1maxSize,
        hits: this.stats.L1hits
      },
      L2: {
        path: this.L2Path,
        hits: this.stats.L2hits
      },
      migrations: this.stats.migrations
    };
  }

  /**
   * 清空所有数据
   */
  async clear() {
    this.L0.clear();
    this.L1.clear();

    // 清空 L2 目录
    try {
      const files = await fs.readdir(this.L2Path);
      for (const file of files) {
        await fs.unlink(path.join(this.L2Path, file));
      }
    } catch (error) {
      logger.warn('清空 L2 失败', { error });
    }

    logger.info('存储层已清空');
  }

  /**
   * 关闭存储层
   */
  async close() {
    logger.info('存储层关闭', this.getStats());
  }
}
