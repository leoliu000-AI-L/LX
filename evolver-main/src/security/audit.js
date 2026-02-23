/**
 * PCEC 安全审计模块
 * 记录和监控安全相关操作
 */

const fs = require('fs');
const path = require('path');

/**
 * 审计日志器
 */
class SecurityAuditor {
  constructor(options = {}) {
    this.logPath = options.logPath || path.join(process.cwd(), 'logs/security-audit.jsonl');
    this.enabled = options.enabled !== false;
  }

  /**
   * 记录审计事件
   * @param {Object} event - 审计事件
   */
  log(event) {
    if (!this.enabled) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      event_id: this.generateEventId(),
      ...event
    };

    // 确保日志目录存在
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 写入审计日志
    try {
      fs.appendFileSync(this.logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[SecurityAuditor] 写入审计日志失败:', error.message);
    }
  }

  /**
   * 生成事件 ID
   */
  generateEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * 记录敏感操作
   * @param {string} operation - 操作类型
   * @param {Object} details - 操作详情
   * @param {Object} result - 操作结果
   */
  logSensitiveOperation(operation, details, result) {
    this.log({
      type: 'sensitive_operation',
      operation: operation,
      details: details,
      result: {
        success: result.success === true,
        error: result.error || null
      },
      user: details.user || 'admin',
      context: {
        cwd: process.cwd(),
        platform: process.platform,
        arch: process.arch
      }
    });
  }

  /**
   * 记录权限变更
   * @param {string} resource - 资源
   * @param {string} action - 操作（grant, revoke）
   * @param {Object} details - 详情
   */
  logPermissionChange(resource, action, details) {
    this.log({
      type: 'permission_change',
      resource: resource,
      action: action,
      details: details,
      user: details.user || 'admin',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录安全事件
   * @param {string} eventType - 事件类型
   * @param {Object} details - 事件详情
   */
  logSecurityEvent(eventType, details) {
    this.log({
      type: 'security_event',
      event_type: eventType,
      details: details,
      severity: details.severity || 'info',
      user: 'system',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 读取审计日志
   * @param {Object} options - 选项
   * @returns {Array} 审计记录
   */
  readAuditLog(options = {}) {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      let events = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      }).filter(event => event !== null);

      // 过滤
      if (options.type) {
        events = events.filter(e => e.type === options.type);
      }

      if (options.limit) {
        events = events.slice(-options.limit);
      }

      if (options.startDate) {
        const start = new Date(options.startDate).getTime();
        events = events.filter(e => new Date(e.timestamp).getTime() >= start);
      }

      if (options.endDate) {
        const end = new Date(options.endDate).getTime();
        events = events.filter(e => new Date(e.timestamp).getTime() <= end);
      }

      return events;
    } catch (error) {
      console.error('[SecurityAuditor] 读取审计日志失败:', error.message);
      return [];
    }
  }

  /**
   * 生成审计报告
   * @returns {Object} 审计报告
   */
  generateReport() {
    const events = this.readAuditLog();

    // 统计
    const stats = {
      total: events.length,
      by_type: {},
      by_user: {},
      sensitive_operations: 0,
      security_events: 0,
      permission_changes: 0
    };

    for (const event of events) {
      stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1;

      if (event.user) {
        stats.by_user[event.user] = (stats.by_user[event.user] || 0) + 1;
      }

      if (event.type === 'sensitive_operation') {
        stats.sensitive_operations++;
      }

      if (event.type === 'security_event') {
        stats.security_events++;
      }

      if (event.type === 'permission_change') {
        stats.permission_changes++;
      }
    }

    return {
      report_period: {
        generated_at: new Date().toISOString(),
        events_analyzed: stats.total
      },
      statistics: stats,
      recent_events: events.slice(-10),
      recommendations: this.generateRecommendations(stats)
    };
  }

  /**
   * 生成安全建议
   */
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.sensitive_operations > 100) {
      recommendations.push('敏感操作频繁，建议加强监控');
    }

    if (stats.security_events > 10) {
      recommendations.push('安全事件较多，建议进行全面审计');
    }

    if (stats.permission_changes > 5) {
      recommendations.push('权限变更频繁，建议审查权限配置');
    }

    return recommendations;
  }
}

/**
 * 创建安全审计器
 * @param {Object} options - 选项
 * @returns {SecurityAuditor} 审计器实例
 */
function createSecurityAuditor(options = {}) {
  return new SecurityAuditor(options);
}

module.exports = {
  SecurityAuditor,
  createSecurityAuditor
};
