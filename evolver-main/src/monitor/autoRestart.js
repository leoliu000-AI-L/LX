/**
 * PCEC 自动重启模块
 * 检测进程崩溃并自动重启
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 进程管理器配置
 */
const CONFIG = {
  maxRestartAttempts: 5,
  restartDelay: 5000, // 5 秒
  backoffMultiplier: 2,
  maxBackoffDelay: 60000, // 60 秒
  crashThreshold: 3, // 3 次崩溃后进入冷却期
  cooldownPeriod: 300000, // 5 分钟冷却
  restartLog: 'logs/restart-history.jsonl'
};

/**
 * 读取重启历史
 * @returns {Array} 重启历史记录
 */
function readRestartHistory() {
  const logPath = path.join(process.cwd(), CONFIG.restartLog);

  if (!fs.existsSync(logPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(logPath, 'utf8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(entry => entry !== null);
  } catch (error) {
    console.error('[AutoRestart] 读取重启历史失败:', error.message);
    return [];
  }
}

/**
 * 写入重启记录
 * @param {Object} entry - 重启记录
 */
function writeRestartEntry(entry) {
  const logPath = path.join(process.cwd(), CONFIG.restartLog);
  const logDir = path.dirname(logPath);

  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  try {
    const entryWithTimestamp = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    fs.appendFileSync(logPath, JSON.stringify(entryWithTimestamp) + '\n');
  } catch (error) {
    console.error('[AutoRestart] 写入重启记录失败:', error.message);
  }
}

/**
 * 统计最近的崩溃次数
 * @param {number} windowMs - 时间窗口（毫秒）
 * @returns {number} 崩溃次数
 */
function countRecentCrashes(windowMs = CONFIG.cooldownPeriod) {
  const history = readRestartHistory();
  const now = Date.now();
  const windowStart = now - windowMs;

  return history.filter(entry => {
    const entryTime = new Date(entry.timestamp).getTime();
    return entryTime > windowStart && entry.reason === 'crash';
  }).length;
}

/**
 * 检查是否在冷却期
 * @returns {boolean} 是否在冷却期
 */
function isInCooldown() {
  const recentCrashes = countRecentCrashes();
  return recentCrashes >= CONFIG.crashThreshold;
}

/**
 * 计算重启延迟
 * @param {number} attempt - 重启尝试次数
 * @returns {number} 延迟时间（毫秒）
 */
function calculateRestartDelay(attempt) {
  const delay = CONFIG.restartDelay * Math.pow(CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, CONFIG.maxBackoffDelay);
}

/**
 * 启动 Evolver 进程
 * @param {Object} options - 启动选项
 * @returns {Object} 启动结果
 */
function startEvolver(options = {}) {
  const {
    nodeId = null,
    loop = true,
    cwd = process.cwd()
  } = options;

  try {
    const env = { ...process.env };
    if (nodeId) {
      env.A2A_NODE_ID = nodeId;
    }
    env.A2A_HUB_URL = env.A2A_HUB_URL || 'https://evomap.ai';

    const args = ['index.js'];
    if (loop) {
      args.push('--loop');
    }

    const nodePath = process.execPath;
    const command = `"${nodePath}" ${args.join(' ')}`;

    // Windows 需要特殊处理
    if (process.platform === 'win32') {
      const { spawn } = require('child_process');
      const proc = spawn(nodePath, args, {
        cwd: cwd,
        env: env,
        detached: true,
        stdio: 'ignore',
        shell: false
      });

      proc.unref();

      return {
        success: true,
        pid: proc.pid,
        method: 'spawn'
      };
    }

    // Unix/Linux: 使用 nohup
    const nohupCommand = `nohup ${command} > /dev/null 2>&1 & echo $!`;
    const pidOutput = execSync(nohupCommand, {
      cwd: cwd,
      env: env,
      stdio: ['ignore', 'pipe', 'ignore']
    });

    const pid = parseInt(pidOutput.toString().trim());

    return {
      success: true,
      pid: pid,
      method: 'nohup'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 自动重启 Evolver
 * @param {Object} options - 重启选项
 * @returns {Object} 重启结果
 */
function autoRestart(options = {}) {
  const {
    nodeId = null,
    maxAttempts = CONFIG.maxRestartAttempts,
    onRestartAttempt = null,
    onCooldown = null
  } = options;

  // 检查冷却期
  if (isInCooldown()) {
    const recentCrashes = countRecentCrashes();
    const message = `在冷却期中（最近 ${recentCrashes} 次崩溃），暂停自动重启`;

    console.warn(`[AutoRestart] ${message}`);

    if (onCooldown) {
      onCooldown({
        reason: 'cooldown',
        recentCrashes: recentCrashes,
        cooldownPeriod: CONFIG.cooldownPeriod
      });
    }

    return {
      success: false,
      reason: 'cooldown',
      message: message
    };
  }

  // 执行重启
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = calculateRestartDelay(attempt);

    console.log(`[AutoRestart] 重启尝试 ${attempt}/${maxAttempts}，延迟 ${delay}ms`);

    if (onRestartAttempt) {
      onRestartAttempt(attempt, maxAttempts, delay);
    }

    // 等待延迟
    if (delay > 0) {
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      await wait(delay);
    }

    // 启动进程
    const result = startEvolver({ nodeId, loop: true });

    if (result.success) {
      console.log(`[AutoRestart] ✅ 重启成功 (PID: ${result.pid}, 方法: ${result.method})`);

      writeRestartEntry({
        attempt: attempt,
        success: true,
        pid: result.pid,
        method: result.method,
        reason: 'auto_restart'
      });

      return {
        success: true,
        pid: result.pid,
        method: result.method,
        attempt: attempt
      };
    }

    lastError = result.error;
    console.error(`[AutoRestart] ❌ 重启失败: ${lastError}`);

    writeRestartEntry({
      attempt: attempt,
      success: false,
      error: lastError,
      reason: 'restart_failed'
    });
  }

  // 所有尝试都失败
  console.error(`[AutoRestart] 💥 所有重启尝试都失败`);

  writeRestartEntry({
    success: false,
    reason: 'all_attempts_failed',
    maxAttempts: maxAttempts
  });

  return {
    success: false,
    reason: 'all_attempts_failed',
    error: lastError
  };
}

/**
 * 创建监控并自动重启的守护进程
 * @param {Object} options - 守护选项
 * @returns {Object} 守护句柄
 */
function createGuardian(options = {}) {
  const {
    pid = null,
    nodeId = null,
    checkInterval = 10000, // 10 秒
    healthCheck = null
  } = options;

  let running = true;
  let currentPid = pid;
  let restartAttempts = 0;

  async function guard() {
    if (!running) return;

    // 检查进程
    if (currentPid) {
      const { execSync } = require('child_process');
      try {
        if (process.platform !== 'win32') {
          execSync(`kill -0 ${currentPid}`, { stdio: 'ignore' });
        } else {
          execSync(`tasklist //FI "PID eq ${currentPid}"`, { stdio: 'ignore' });
        }

        // 进程存在，执行健康检查
        if (healthCheck) {
          const healthy = await healthCheck(currentPid);
          if (!healthy) {
            console.warn(`[Guardian] 进程 ${currentPid} 不健康，准备重启`);
            currentPid = null;
          }
        }
      } catch (error) {
        // 进程不存在
        console.warn(`[Guardian] 进程 ${currentPid} 已停止`);
        currentPid = null;
      }
    }

    // 进程不存在，尝试重启
    if (!currentPid) {
      console.log('[Guardian] 尝试自动重启 Evolver');

      const result = await autoRestart({
        nodeId: nodeId,
        onCooldown: (info) => {
          console.log('[Guardian] 进入冷却期');
        }
      });

      if (result.success) {
        currentPid = result.pid;
        restartAttempts = 0;
        console.log(`[Guardian] ✅ 守护进程已重启 Evolver (PID: ${currentPid})`);
      } else {
        restartAttempts++;
        console.error(`[Guardian] ❌ 重启失败: ${result.reason}`);

        if (restartAttempts >= CONFIG.maxRestartAttempts) {
          console.error('[Guardian] 💥 达到最大重启次数，停止守护');
          running = false;
        }
      }
    }

    // 继续守护
    if (running) {
      setTimeout(guard, checkInterval);
    }
  }

  // 启动守护
  guard();

  return {
    stop: () => {
      running = false;
      console.log('[Guardian] 守护进程已停止');
    },
    getCurrentPid: () => currentPid,
    isRunning: () => running
  };
}

module.exports = {
  CONFIG,
  readRestartHistory,
  countRecentCrashes,
  isInCooldown,
  startEvolver,
  autoRestart,
  createGuardian
};
