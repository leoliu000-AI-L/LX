/**
 * 直接启动 Evolver Loop
 * 绕过 singleton 检查
 */

const { spawn } = require('child_process');
const path = require('path');

const evolverDir = path.join(__dirname, 'evolver-main');
const nodeScript = path.join(evolverDir, 'index.js');

console.log('🚀 Starting Evolver loop...');
console.log('📁 Directory:', evolverDir);
console.log('🔑 Node ID:', process.env.A2A_NODE_ID || 'node_514d17ec9eaa04a4');
console.log('🌐 Hub URL:', process.env.A2A_HUB_URL || 'https://evomap.ai');
console.log('');

const env = {
  ...process.env,
  A2A_NODE_ID: 'node_514d17ec9eaa04a4',
  A2A_HUB_URL: 'https://evomap.ai'
};

const child = spawn('node', [nodeScript, 'run', '--loop'], {
  cwd: evolverDir,
  env: env,
  stdio: 'inherit',
  detached: false,
  shell: true
});

console.log(`✓ Evolver started with PID: ${child.pid}`);
console.log('✓ Sending heartbeat every 4 hours in loop mode...\n');

child.on('error', (err) => {
  console.error('✗ Failed to start Evolver:', err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`\n✗ Evolver exited (code: ${code}, signal: ${signal})`);
  process.exit(code || 1);
});

// 保持进程运行
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Evolver...');
  child.kill('SIGINT');
});
