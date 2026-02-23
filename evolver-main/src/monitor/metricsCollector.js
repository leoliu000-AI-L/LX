/**
 * PCEC 性能指标采集模块
 * 采集 CPU、内存、网络等性能指标
 */

const fs = require('fs');
const path = require('path');

/**
 * 指标存储
 */
class MetricsStore {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.metrics = [];
    this.file = options.file || 'logs/metrics.jsonl';
  }

  /**
   * 添加指标
   * @param {Object} metric - 指标对象
   */
  add(metric) {
    const entry = {
      ...metric,
      timestamp: Date.now(),
      iso: new Date().toISOString()
    };

    this.metrics.push(entry);

    // 限制大小
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }

    // 持久化
    this.persist();
  }

  /**
   * 持久化到文件
   */
  persist() {
    if (!this.file) return;

    try {
      const dir = path.dirname(this.file);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const lastEntry = this.metrics[this.metrics.length - 1];
      fs.appendFileSync(this.file, JSON.stringify(lastEntry) + '\n');
    } catch (error) {
      console.error('[MetricsStore] 持久化失败:', error.message);
    }
  }

  /**
   * 获取最近的指标
   * @param {number} count - 数量
   * @returns {Array} 指标数组
   */
  getRecent(count = 100) {
    return this.metrics.slice(-count);
  }

  /**
   * 按时间范围获取指标
   * @param {number} startMs - 开始时间（毫秒）
   * @param {number} endMs - 结束时间（毫秒）
   * @returns {Array} 指标数组
   */
  getByTimeRange(startMs, endMs) {
    return this.metrics.filter(m => m.timestamp >= startMs && m.timestamp <= endMs);
  }

  /**
   * 计算统计信息
   * @param {string} field - 字段名
   * @param {number} count - 数量
   * @returns {Object} 统计信息
   */
  getStats(field, count = 100) {
    const recent = this.getRecent(count);
    const values = recent.map(m => m[field]).filter(v => typeof v === 'number');

    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * 清空指标
   */
  clear() {
    this.metrics = [];
  }

  /**
   * 从文件加载
   */
  loadFromFile() {
    if (!this.file || !fs.existsSync(this.file)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.file, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      this.metrics = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      }).filter(entry => entry !== null);

      // 限制大小
      if (this.metrics.length > this.maxSize) {
        this.metrics = this.metrics.slice(-this.maxSize);
      }
    } catch (error) {
      console.error('[MetricsStore] 加载失败:', error.message);
    }
  }
}

/**
 * 性能指标采集器
 */
class MetricsCollector {
  constructor(options = {}) {
    this.store = new MetricsStore(options);
    this.pid = options.pid || null;
    this.interval = options.interval || 5000; // 5 秒
    this.collecting = false;
    this.timer = null;
  }

  /**
   * 采集进程指标
   * @returns {Object} 进程指标
   */
  collectProcessMetrics() {
    if (!this.pid) {
      return null;
    }

    const { getProcessInfo } = require('./processMonitor');
    const procInfo = getProcessInfo(this.pid);

    if (!procInfo) {
      return {
        pid: this.pid,
        alive: false
      };
    }

    return {
      pid: procInfo.pid,
      alive: true,
      cpuPercent: procInfo.cpuPercent,
      memPercent: procInfo.memPercent,
      rss: procInfo.rss * 1024, // 转换为字节
      rssMb: procInfo.rss / 1024,
      elapsed: procInfo.elapsed,
      command: procInfo.command
    };
  }

  /**
   * 采集系统指标
   * @returns {Object} 系统指标
   */
  collectSystemMetrics() {
    const { getSystemStats } = require('./processMonitor');
    const sysStats = getSystemStats();

    return {
      memory: {
        total: sysStats.memory.total,
        used: sysStats.memory.used,
        free: sysStats.memory.free,
        percent: sysStats.memory.percent
      },
      uptime: process.uptime(),
      platform: process.platform,
      arch: process.arch
    };
  }

  /**
   * 采集应用指标
   * @returns {Object} 应用指标
   */
  collectAppMetrics() {
    const memUsage = process.memoryUsage();

    return {
      nodeVersion: process.version,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      rss: memUsage.rss
    };
  }

  /**
   * 采集所有指标
   * @returns {Object} 所有指标
   */
  collect() {
    return {
      process: this.collectProcessMetrics(),
      system: this.collectSystemMetrics(),
      app: this.collectAppMetrics()
    };
  }

  /**
   * 开始采集
   * @param {Function} callback - 回调函数
   */
  start(callback) {
    if (this.collecting) {
      console.warn('[MetricsCollector] 已在采集中');
      return;
    }

    this.collecting = true;

    const tick = () => {
      if (!this.collecting) return;

      const metrics = this.collect();
      this.store.add(metrics);

      if (callback) {
        callback(metrics);
      }

      this.timer = setTimeout(tick, this.interval);
    };

    tick();
  }

  /**
   * 停止采集
   */
  stop() {
    this.collecting = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 获取指标报告
   * @returns {Object} 指标报告
   */
  getReport() {
    const cpuStats = this.store.getStats('cpuPercent');
    const memStats = this.store.getStats('memPercent');
    const rssStats = this.store.getStats('rss');

    return {
      duration: {
        start: this.store.metrics[0]?.iso,
        end: this.store.metrics[this.store.metrics.length - 1]?.iso,
        samples: this.store.metrics.length
      },
      cpu: cpuStats,
      memory: memStats,
      rss: rssStats
    };
  }
}

/**
 * 创建性能采集器实例
 * @param {Object} options - 选项
 * @returns {MetricsCollector} 采集器实例
 */
function createCollector(options = {}) {
  return new MetricsCollector(options);
}

module.exports = {
  MetricsStore,
  MetricsCollector,
  createCollector
};
