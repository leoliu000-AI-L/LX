/**
 * PCEC 智能进程管理模块
 * 处理 PID 文件、僵尸进程检测和清理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PID_FILE = 'evolver.pid';
const PID_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 分钟超时

/**
 * 检查进程是否在运行
 * @param {number} pid - 进程 ID
 * @returns {boolean} 进程是否在运行
 */
function isProcessRunning(pid) {
  try {
    // Unix/Linux: 使用 kill -0 检查进程
    if (process.platform !== 'win32') {
      execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
      return true;
    }

    // Windows: 使用 tasklist 检查进程
    const result = execSync(`tasklist //FI "PID eq ${pid}"`, {
      encoding: 'utf8',
      stdio: 'ignore'
    });
    return result.includes(pid.toString());
  } catch (error) {
    // 进程不存在
    return false;
  }
}

/**
 * 获取 PID 文件路径
 * @returns {string} PID 文件路径
 */
function getPidFilePath() {
  return path.join(process.cwd(), PID_FILE);
}

/**
 * 读取 PID 文件
 * @returns {number|null} PID 或 null
 */
function readPidFile() {
  const pidPath = getPidFilePath();

  if (!fs.existsSync(pidPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(pidPath, 'utf8');
    const pid = parseInt(content.trim());

    if (isNaN(pid)) {
      console.warn('[ProcessManager] PID 文件内容无效:', content);
      return null;
    }

    return pid;
  } catch (error) {
    console.error('[ProcessManager] 读取 PID 文件失败:', error.message);
    return null;
  }
}

/**
 * 写入 PID 文件
 * @param {number} pid - 进程 ID
 */
function writePidFile(pid) {
  const pidPath = getPidFilePath();

  try {
    fs.writeFileSync(pidPath, pid.toString(), 'utf8');
  } catch (error) {
    console.error('[ProcessManager] 写入 PID 文件失败:', error.message);
  }
}

/**
 * 删除 PID 文件
 */
function removePidFile() {
  const pidPath = getPidFilePath();

  if (fs.existsSync(pidPath)) {
    try {
      fs.unlinkSync(pidPath);
    } catch (error) {
      console.error('[ProcessManager] 删除 PID 文件失败:', error.message);
    }
  }
}

/**
 * 获取 PID 文件修改时间
 * @returns {Date|null} 修改时间或 null
 */
function getPidFileAge() {
  const pidPath = getPidFilePath();

  if (!fs.existsSync(pidPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(pidPath);
    return stats.mtime;
  } catch (error) {
    return null;
  }
}

/**
 * 检查并清理僵尸进程
 * @returns {Object} 检查结果
 */
function checkAndCleanupZombieProcess() {
  const pid = readPidFile();

  if (pid === null) {
    return {
      hasPidFile: false,
      pid: null,
      running: false,
      action: 'none'
    };
  }

  const running = isProcessRunning(pid);
  const fileAge = getPidFileAge();
  const now = new Date();
  let isStale = false;

  if (fileAge) {
    const age = now - fileAge;
    isStale = age > PID_LOCK_TIMEOUT;
  }

  // 决策树
  if (running && !isStale) {
    // 进程在运行且未超时
    return {
      hasPidFile: true,
      pid: pid,
      running: true,
      stale: false,
      action: 'keep',
      message: `Evolver 已在运行 (PID: ${pid})`
    };
  }

  if (running && isStale) {
    // 进程在运行但已超时（可能是僵尸锁）
    console.warn(`[ProcessManager] 检测到僵尸进程锁 (PID: ${pid}, 超时: ${Math.round((now - fileAge) / 1000)}秒)`);

    return {
      hasPidFile: true,
      pid: pid,
      running: true,
      stale: true,
      action: 'suggest_manual_cleanup',
      message: `进程 ${pid} 正在运行，但 PID 文件已超时`,
      suggestion: '如果确定进程已卡死，请手动杀死进程后重试'
    };
  }

  if (!running) {
    // 进程不在运行，清理 PID 文件
    console.log(`[ProcessManager] 检测到僵尸 PID 文件 (PID: ${pid})，已清理`);
    removePidFile();

    return {
      hasPidFile: true,
      pid: pid,
      running: false,
      action: 'cleaned',
      message: `已清理僵尸 PID 文件`
    };
  }

  return {
    hasPidFile: true,
    pid: pid,
    running: false,
    action: 'unknown',
    message: '未知状态'
  };
}

/**
 * 尝试获取进程锁
 * @param {boolean} force - 是否强制获取锁
 * @returns {Object} 获取结果
 */
function acquireProcessLock(force = false) {
  const check = checkAndCleanupZombieProcess();

  // 已经有实例在运行
  if (check.running && !check.stale && !force) {
    return {
      success: false,
      check: check,
      message: check.message
    };
  }

  // 可以启动新实例
  const currentPid = process.pid;
  writePidFile(currentPid);

  console.log(`[ProcessManager] 进程锁已获取 (PID: ${currentPid})`);

  return {
    success: true,
    pid: currentPid,
    check: check,
    message: `Evolver 启动 (PID: ${currentPid})`
  };
}

/**
 * 释放进程锁
 */
function releaseProcessLock() {
  const pid = readPidFile();

  if (pid === process.pid) {
    console.log('[ProcessManager] 释放进程锁');
    removePidFile();
  } else if (pid !== null) {
    console.warn(`[ProcessManager] PID 文件不匹配 (文件: ${pid}, 当前: ${process.pid})`);
  }
}

/**
 * 优雅退出处理
 */
function setupGracefulExit() {
  const cleanup = () => {
    console.log('');
    console.log('[ProcessManager] 正在退出...');
    releaseProcessLock();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Windows 特定信号
  if (process.platform === 'win32') {
    process.on('SIGBREAK', cleanup);
  }
}

module.exports = {
  isProcessRunning,
  readPidFile,
  writePidFile,
  removePidFile,
  checkAndCleanupZombieProcess,
  acquireProcessLock,
  releaseProcessLock,
  setupGracefulExit
};
