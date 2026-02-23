#!/usr/bin/env node
/**
 * 确保 Evolver 循环模式持续运行
 *
 * 功能：
 * 1. 检查 Evolver 进程是否运行
 * 2. 如果未运行，自动启动
 * 3. 定期执行多智能体发现任务
 * 4. 监控循环健康状态
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// 配置
const CONFIG = {
  pidFile: path.join(__dirname, '../evolver.pid'),
  logFile: path.join(__dirname, '../../evolver-daemon.log'),
  loopLogFile: path.join(__dirname, '../../evolver-loop.log'),
  nodeId: 'node_514d17ec9eaa04a4',
  hubUrl: 'https://evomap.ai',
  checkInterval: 60000,  // 检查间隔：1分钟
  multiAgentDiscoveryInterval: 3600000  // 多智能体发现间隔：1小时
};

/**
 * 检查进程是否运行
 */
function isProcessRunning(pid) {
  return new Promise((resolve) => {
    exec(`ps -p ${pid} 2>/dev/null | grep -v grep`, (error) => {
      resolve(!error);
    });
  });
}

/**
 * 获取 Evolver PID
 */
function getEvolverPid() {
  try {
    if (fs.existsSync(CONFIG.pidFile)) {
      return parseInt(fs.readFileSync(CONFIG.pidFile, 'utf8').trim());
    }
  } catch (error) {
    console.error('读取 PID 文件失败:', error.message);
  }
  return null;
}

/**
 * 启动 Evolver 循环模式
 */
function startEvolverLoop() {
  console.log('🚀 启动 Evolver 循环模式...');

  const env = {
    ...process.env,
    A2A_NODE_ID: CONFIG.nodeId,
    A2A_HUB_URL: CONFIG.hubUrl
  };

  const out = fs.openSync(CONFIG.loopLogFile, 'a');
  const err = fs.openSync(CONFIG.loopLogFile, 'a');

  const child = spawn('node', ['index.js', '--loop'], {
    cwd: path.join(__dirname, '..'),
    detached: true,
    stdio: ['ignore', out, err],
    env: env
  });

  // 保存 PID
  fs.writeFileSync(CONFIG.pidFile, String(child.pid));

  child.unref();

  console.log(`✅ Evolver 循环模式已启动 (PID: ${child.pid})`);
  console.log(`📝 日志文件: ${CONFIG.loopLogFile}`);

  return child.pid;
}

/**
 * 确保 Evolver 运行
 */
async function ensureEvolverRunning() {
  const pid = getEvolverPid();

  if (pid && await isProcessRunning(pid)) {
    console.log(`✅ Evolver 正在运行 (PID: ${pid})`);
    return pid;
  }

  console.log('⚠️  Evolver 未运行，正在启动...');
  return startEvolverLoop();
}

/**
 * 执行多智能体发现
 */
async function runMultiAgentDiscovery() {
  const hookScript = path.join(__dirname, 'hook-multi-agent-discovery.js');

  return new Promise((resolve) => {
    console.log('\n🔍 执行多智能体协作发现任务...');

    const child = spawn('node', [hookScript], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 多智能体发现任务完成');
      } else {
        console.log(`⚠️  多智能体发现任务退出 (code: ${code})`);
      }
      resolve(code);
    });
  });
}

/**
 * 检查循环状态
 */
function checkLoopHealth() {
  try {
    if (!fs.existsSync(CONFIG.loopLogFile)) {
      return { healthy: false, reason: '日志文件不存在' };
    }

    const stats = fs.statSync(CONFIG.loopLogFile);
    const lastModified = new Date(stats.mtime);
    const now = new Date();
    const minutesSince = (now - lastModified) / 1000 / 60;

    // 如果日志超过 10 分钟没有更新，认为不健康
    if (minutesSince > 10) {
      return {
        healthy: false,
        reason: `日志文件已 ${minutesSince.toFixed(0)} 分钟未更新`
      };
    }

    // 读取最后几行日志检查是否有错误
    const logContent = fs.readFileSync(CONFIG.loopLogFile, 'utf8');
    const lastLines = logContent.split('\n').slice(-20).join('\n');

    if (lastLines.includes('[Singleton] Evolver loop already running')) {
      return { healthy: true, reason: '循环正常运行' };
    }

    if (lastLines.includes('Error') || lastLines.includes('error')) {
      return { healthy: false, reason: '日志中发现错误' };
    }

    return { healthy: true, reason: '循环正常' };
  } catch (error) {
    return { healthy: false, reason: error.message };
  }
}

/**
 * 主循环
 */
async function main() {
  console.log('========================================');
  console.log('🔄 PCEC Evolver 循环监控器');
  console.log('========================================\n');

  let lastDiscoveryTime = 0;

  // 定期检查
  setInterval(async () => {
    const now = Date.now();

    console.log(`\n[${new Date().toLocaleTimeString('zh-CN')}] 检查 Evolver 状态...`);

    // 1. 确保 Evolver 运行
    const pid = await ensureEvolverRunning();

    // 2. 检查健康状态
    const health = checkLoopHealth();
    console.log(`健康状态: ${health.healthy ? '✅' : '❌'} ${health.reason}`);

    // 3. 定期执行多智能体发现（每小时）
    if (now - lastDiscoveryTime >= CONFIG.multiAgentDiscoveryInterval) {
      await runMultiAgentDiscovery();
      lastDiscoveryTime = now;
    } else {
      const nextRun = Math.ceil((CONFIG.multiAgentDiscoveryInterval - (now - lastDiscoveryTime)) / 60000);
      console.log(`下次多智能体发现: ${nextRun} 分钟后`);
    }

    console.log(`\n当前 PID: ${pid}`);
    console.log(`节点 ID: ${CONFIG.nodeId}`);
    console.log(`Hub URL: ${CONFIG.hubUrl}`);

  }, CONFIG.checkInterval);

  // 立即执行一次
  console.log('✅ 监控器已启动');
  console.log(`检查间隔: ${CONFIG.checkInterval / 1000} 秒`);
  console.log(`多智能体发现间隔: ${CONFIG.multiAgentDiscoveryInterval / 60000} 分钟`);
  console.log('\n按 Ctrl+C 停止监控\n');

  // 立即执行一次检查
  await ensureEvolverRunning();
  await runMultiAgentDiscovery();
}

// 启动
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ensureEvolverRunning, runMultiAgentDiscovery, checkLoopHealth };
