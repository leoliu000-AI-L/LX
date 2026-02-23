/**
 * PCEC 异常检测模块
 * 识别性能异常和故障模式
 */

/**
 * 异常检测器
 */
class AnomalyDetector {
  constructor(options = {}) {
    this.thresholds = {
      cpu: options.cpuThreshold || 80, // CPU 百分比
      memory: options.memoryThreshold || 80, // 内存百分比
      rss: options.rssThreshold || 1000 * 1024 * 1024, // RSS 字节 (1GB)
      crashWindow: options.crashWindow || 300000, // 5 分钟
      spikeThreshold: options.spikeThreshold || 2.0 // 倍数
    };

    this.history = [];
    this.maxHistory = options.maxHistory || 100;
  }

  /**
   * 添加指标到历史
   * @param {Object} metrics - 指标对象
   */
  addHistory(metrics) {
    this.history.push({
      timestamp: Date.now(),
      ...metrics
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * 检测异常
   * @param {Object} metrics - 当前指标
   * @returns {Object} 异常检测结果
   */
  detect(metrics) {
    this.addHistory(metrics);

    const anomalies = [];

    // CPU 异常检测
    if (metrics.process?.cpuPercent > this.thresholds.cpu) {
      anomalies.push({
        type: 'high_cpu',
        severity: 'warning',
        message: `CPU 使用率过高: ${metrics.process.cpuPercent}%`,
        value: metrics.process.cpuPercent,
        threshold: this.thresholds.cpu
      });
    }

    // 内存异常检测
    if (metrics.process?.memPercent > this.thresholds.memory) {
      anomalies.push({
        type: 'high_memory',
        severity: 'warning',
        message: `内存使用率过高: ${metrics.process.memPercent}%`,
        value: metrics.process.memPercent,
        threshold: this.thresholds.memory
      });
    }

    // RSS 异常检测
    if (metrics.process?.rss > this.thresholds.rss) {
      anomalies.push({
        type: 'high_rss',
        severity: 'warning',
        message: `内存占用过大: ${(metrics.process.rss / 1024 / 1024).toFixed(0)} MB`,
        value: metrics.process.rss,
        threshold: this.thresholds.rss
      });
    }

    // 进程死亡检测
    if (metrics.process && !metrics.process.alive) {
      anomalies.push({
        type: 'process_dead',
        severity: 'critical',
        message: `进程 ${metrics.process.pid} 已停止`,
        pid: metrics.process.pid
      });
    }

    // 尖峰检测
    const spike = this.detectSpike(metrics);
    if (spike) {
      anomalies.push(spike);
    }

    // 趋势检测
    const trend = this.detectTrend();
    if (trend) {
      anomalies.push(trend);
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies: anomalies,
      severity: this.getSeverity(anomalies)
    };
  }

  /**
   * 检测尖峰
   * @param {Object} metrics - 当前指标
   * @returns {Object|null} 尖峰异常
   */
  detectSpike(metrics) {
    if (this.history.length < 10) {
      return null;
    }

    const recent = this.history.slice(-10);
    const cpuValues = recent.map(h => h.process?.cpuPercent || 0);
    const avgCpu = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;

    if (metrics.process?.cpuPercent > avgCpu * this.thresholds.spikeThreshold) {
      return {
        type: 'cpu_spike',
        severity: 'warning',
        message: `CPU 尖峰: 当前 ${metrics.process.cpuPercent}%, 平均 ${avgCpu.toFixed(1)}%`,
        current: metrics.process.cpuPercent,
        average: avgCpu
      };
    }

    return null;
  }

  /**
   * 检测趋势
   * @returns {Object|null} 趋势异常
   */
  detectTrend() {
    if (this.history.length < 20) {
      return null;
    }

    const recent = this.history.slice(-20);
    const cpuValues = recent.map(h => h.process?.cpuPercent || 0);

    // 简单线性回归检测上升趋势
    const n = cpuValues.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = cpuValues.reduce((a, b) => a + b, 0);
    const sumXY = cpuValues.reduce((sum, y, x) => sum + x * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX * sumX - sumX * sumX);

    // 持续上升且斜率较大
    if (slope > 1 && cpuValues[cpuValues.length - 1] > 50) {
      return {
        type: 'increasing_trend',
        severity: 'warning',
        message: `CPU 持续上升，斜率: ${slope.toFixed(2)}`,
        slope: slope,
        current: cpuValues[cpuValues.length - 1]
      };
    }

    return null;
  }

  /**
   * 获取异常严重程度
   * @param {Array} anomalies - 异常列表
   * @returns {string} 严重程度
   */
  getSeverity(anomalies) {
    if (anomalies.some(a => a.severity === 'critical')) {
      return 'critical';
    }
    if (anomalies.length >= 3) {
      return 'high';
    }
    if (anomalies.length >= 1) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 生成异常报告
   * @param {Object} detection - 检测结果
   * @returns {Object} 异常报告
   */
  generateReport(detection) {
    const report = {
      timestamp: new Date().toISOString(),
      hasAnomalies: detection.hasAnomalies,
      severity: detection.severity,
      anomalies: detection.anomalies,
      recommendations: []
    };

    // 生成建议
    if (detection.hasAnomalies) {
      if (detection.anomalies.some(a => a.type === 'high_cpu')) {
        report.recommendations.push('检查是否有高负载任务');
        report.recommendations.push('考虑优化算法或增加资源');
      }

      if (detection.anomalies.some(a => a.type === 'high_memory')) {
        report.recommendations.push('检查是否有内存泄漏');
        report.recommendations.push('考虑重启进程或增加内存限制');
      }

      if (detection.anomalies.some(a => a.type === 'process_dead')) {
        report.recommendations.push('立即重启进程');
        report.recommendations.push('检查崩溃日志');
      }

      if (detection.anomalies.some(a => a.type === 'increasing_trend')) {
        report.recommendations.push('监控资源使用趋势');
        report.recommendations.push('预防性优化或扩容');
      }
    }

    return report;
  }

  /**
   * 重置历史
   */
  reset() {
    this.history = [];
  }
}

/**
 * 创建异常检测器
 * @param {Object} options - 选项
 * @returns {AnomalyDetector} 检测器实例
 */
function createDetector(options = {}) {
  return new AnomalyDetector(options);
}

module.exports = {
  AnomalyDetector,
  createDetector
};
