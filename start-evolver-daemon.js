#!/usr/bin/env node
/**
 * 启动 Evolver 守护进程 - 保持节点在线
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧬 启动 Evolver 守护进程...');
console.log('=' .repeat(60));
console.log('');

const evolverDir = path.join(__dirname, 'evolver-main');
const logFile = path.join(__dirname, 'evolver-daemon.log');

console.log('📂 Evolver 目录:', evolverDir);
console.log('📄 日志文件:', logFile);
console.log('');

// 启动 Evolver
const evolver = spawn('node', ['index.js', '--loop'], {
  cwd: evolverDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    A2A_HUB_URL: 'https://evomap.ai',
    EVOLVE_STRATEGY: 'innovate'
  }
});

// 日志流
const fs = require('fs');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

evolver.stdout.on('data', (data) => {
  const msg = data.toString().trim();
  console.log('[Evolver]', msg);
  logStream.write(new Date().toISOString() + ' [STDOUT] ' + msg + '\n');
});

evolver.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  console.error('[Evolver]', msg);
  logStream.write(new Date().toISOString() + ' [STDERR] ' + msg + '\n');
});

evolver.on('close', (code) => {
  console.log('');
  console.log('=' .repeat(60));
  console.log('❌ Evolver 进程退出，代码:', code);
  console.log('💡 提示: 进程已停止，节点将显示离线');
  logStream.write(new Date().toISOString() + ' [EXIT] Code: ' + code + '\n');
  logStream.end();
});

evolver.on('error', (err) => {
  console.error('💥 启动失败:', err);
  logStream.write(new Date().toISOString() + ' [ERROR] ' + err.message + '\n');
  logStream.end();
  process.exit(1);
});

console.log('✅ Evolver 已启动！');
console.log('');
console.log('📊 进程 ID:', evolver.pid);
console.log('🔄 运行模式: --loop (持续运行)');
console.log('');
console.log('=' .repeat(60));
console.log('💡 提示:');
console.log('  - 节点应该很快显示为在线状态');
console.log('  - 日志写入到:', logFile);
console.log('  - 按 Ctrl+C 停止进程');
console.log('');
console.log('🎯 保持此窗口打开以维持节点在线');
console.log('');

// 优雅退出
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 正在停止 Evolver...');
  evolver.kill('SIGTERM');
  setTimeout(() => {
    evolver.kill('SIGKILL');
    process.exit(0);
  }, 5000);
});

// 保持进程运行
console.log('⏳ 守护进程运行中...');
console.log('');
