/**
 * PCEC 进程监控模块
 * 实时监控 Evolver 进程状态和性能指标
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 获取进程信息
 * @param {number} pid - 进程 ID
 * @returns {Object|null} 进程信息
 */
function getProcessInfo(pid) {
  try {
    // Unix/Linux: ps 命令
    if (process.platform !== 'win32') {
      const output = execSync(`ps -p ${pid} -o pid,pcpu,pmem,rss,etime,comm`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      });

      const lines = output.trim().split('\n');
      if (lines.length < 2) return null;

      const parts = lines[1].trim().split(/\s+/);
      return {
        pid: parseInt(parts[0]),
        cpuPercent: parseFloat(parts[1]),
        memPercent: parseFloat(parts[2]),
        rss: parseInt(parts[3]), // 驻留集大小（KB）
        elapsed: parts[4],
        command: parts[5]
      };
    }

    // Windows: tasklist 命令
    const output = execSync(
      `tasklist //FI "PID eq ${pid}" //FO CSV //NH`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );

    const lines = output.trim().split('\n');
    if (lines.length === 0) return null;

    const parts = lines[0].split(',').map(p => p.replace(/"/g, '').trim());
    const memStr = parts[4]; // 格式: "12,345 K"
    const memKb = parseInt(memStr.replace(/[,\sK]/g, ''));

    return {
      pid: pid,
      cpuPercent: 0, // Windows tasklist 不提供 CPU
      memPercent: 0, // 需要总内存计算
      rss: memKb,
      elapsed: 'N/A',
      command: parts[0]
    };
  } catch (error) {
    // 进程不存在
    return null;
  }
}

/**
 * 获取系统资源使用情况
 * @returns {Object} 系统资源信息
 */
function getSystemStats() {
  try {
    // Unix/Linux: /proc/meminfo
    if (process.platform !== 'win32' && fs.existsSync('/proc/meminfo')) {
      const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
      const lines = meminfo.split('\n');

      const memTotal = parseInt(lines[0].split(/\s+/)[1]);
      const memFree = parseInt(lines[1].split(/\s+/)[1]);
      const memAvailable = parseInt(lines[2].split(/\s+/)[1]) || memFree;
      const memUsed = memTotal - memAvailable;

      return {
        memory: {
          total: memTotal * 1024, // 转换为字节
          used: memUsed * 1024,
          free: memAvailable * 1024,
          percent: (memUsed / memTotal) * 100
        }
      };
    }

    // Windows 或其他系统
    return {
      memory: {
        total: 0,
        used: 0,
        free: 0,
        percent: 0
      }
    };
  } catch (error) {
    return {
      memory: {
        total: 0,
        used: 0,
        free: 0,
        percent: 0
      }
    };
  }
}

/**
 * 检查进程健康状态
 * @param {number} pid - 进程 ID
 * @returns {Object} 健康状态
 */
function checkProcessHealth(pid) {
  const procInfo = getProcessInfo(pid);
  const sysStats = getSystemStats();

  if (!procInfo) {
    return {
      healthy: false,
      status: 'dead',
      message: `进程 ${pid} 不存在`,
      recommendations: ['启动新进程']
    };
  }

  const issues = [];
  const warnings = [];

  // CPU 使用率检查
  if (procInfo.cpuPercent > 80) {
    issues.push(`CPU 使用率过高: ${procInfo.cpuPercent}%`);
  } else if (procInfo.cpuPercent > 50) {
    warnings.push(`CPU 使用率较高: ${procInfo.cpuPercent}%`);
  }

  // 内存使用检查
  if (procInfo.memPercent > 80) {
    issues.push(`内存使用率过高: ${procInfo.memPercent}%`);
  } else if (procInfo.memPercent > 50) {
    warnings.push(`内存使用率较高: ${procInfo.memPercent}%`);
  }

  // RSS 检查（驻留集大小）
  const rssMB = procInfo.rss / 1024;
  if (rssMB > 1000) {
    issues.push(`内存占用过大: ${rssMB.toFixed(0)} MB`);
  } else if (rssMB > 500) {
    warnings.push(`内存占用较大: ${rssMB.toFixed(0)} MB`);
  }

  return {
    healthy: issues.length === 0,
    status: issues.length > 0 ? 'unhealthy' : (warnings.length > 0 ? 'warning' : 'healthy'),
    process: procInfo,
    system: sysStats,
    issues: issues,
    warnings: warnings,
    recommendations: generateRecommendations(issues, warnings)
  };
}

/**
 * 生成建议
 * @param {Array} issues - 问题列表
 * @param {Array} warnings - 警告列表
 * @returns {Array} 建议列表
 */
function generateRecommendations(issues, warnings) {
  const recommendations = [];

  if (issues.some(i => i.includes('CPU'))) {
    recommendations.push('检查是否有死循环或高负载任务');
    recommendations.push('考虑增加计算资源或优化算法');
  }

  if (issues.some(i => i.includes('内存'))) {
    recommendations.push('检查是否有内存泄漏');
    recommendations.push('考虑重启进程或增加内存限制');
  }

  if (warnings.length > 0) {
    recommendations.push('持续监控，预防问题恶化');
  }

  return recommendations;
}

/**
 * 持续监控进程
 * @param {number} pid - 进程 ID
 * @param {Object} options - 监控选项
 * @returns {Object} 监控句柄
 */
function monitorProcess(pid, options = {}) {
  const {
    interval = 5000, // 5 秒
    onHealthChange = null,
    onUnhealthy = null,
    logFile = null
  } = options;

  let running = true;
  let lastStatus = null;
  let healthHistory = [];

  const logPath = logFile ? path.resolve(logFile) : null;

  function log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      data: data
    };

    if (logPath) {
      try {
        fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
      } catch (error) {
        console.error('[Monitor] 日志写入失败:', error.message);
      }
    }

    if (level === 'error' || level === 'warn') {
      console[level](`[Monitor] ${message}`, data);
    }
  }

  function tick() {
    if (!running) return;

    const health = checkProcessHealth(pid);
    healthHistory.push({
      timestamp: Date.now(),
      health: health
    });

    // 保留最近 100 条记录
    if (healthHistory.length > 100) {
      healthHistory.shift();
    }

    // 状态变化检测
    if (lastStatus && lastStatus !== health.status) {
      log('info', `进程状态变化: ${lastStatus} → ${health.status}`, {
        pid: pid,
        issues: health.issues,
        warnings: health.warnings
      });

      if (onHealthChange) {
        onHealthChange(lastStatus, health.status, health);
      }
    }

    // 不健康处理
    if (!health.healthy) {
      log('warn', `进程不健康: ${health.status}`, {
        pid: pid,
        issues: health.issues,
        recommendations: health.recommendations
      });

      if (onUnhealthy) {
        onUnhealthy(health);
      }
    }

    lastStatus = health.status;

    // 继续监控
    if (running) {
      setTimeout(tick, interval);
    }
  }

  // 启动监控
  tick();

  return {
    stop: () => {
      running = false;
      log('info', '监控已停止', { pid: pid });
    },
    getHistory: () => healthHistory,
    getLastHealth: () => healthHistory.length > 0 ? healthHistory[healthHistory.length - 1].health : null
  };
}

module.exports = {
  getProcessInfo,
  getSystemStats,
  checkProcessHealth,
  monitorProcess
};
