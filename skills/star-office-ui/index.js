const { exec } = require('child_process');
const path = require('path');

const PROJECT_PATH = '/root/.openclaw/workspace/Star-Office-UI';
const VENV_PYTHON = path.join(PROJECT_PATH, '.venv/bin/python');

async function setState(state, message) {
  return new Promise((resolve, reject) => {
    exec(`${VENV_PYTHON} set_state.py ${state} "${message}"`, {
      cwd: PROJECT_PATH
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          success: true,
          state,
          message,
          output: stdout.trim()
        });
      }
    });
  });
}

async function getHealth() {
  return new Promise((resolve, reject) => {
    exec('curl -s --connect-timeout 2 http://127.0.0.1:19000/health', (error, stdout) => {
      if (error) {
        resolve({ status: 'offline' });
      } else {
        try {
          resolve({ status: 'online', data: JSON.parse(stdout) });
        } catch {
          resolve({ status: 'online', raw: stdout });
        }
      }
    });
  });
}

async function restartService() {
  return new Promise((resolve, reject) => {
    // Kill existing process
    exec('pkill -f "python3 app.py"', () => {
      // Start new process
      exec('cd /root/.openclaw/workspace/Star-Office-UI/backend && source ../.venv/bin/activate && python3 app.py &', (error) => {
        if (error) {
          reject(error);
        } else {
          // Wait 2 seconds for service to start
          setTimeout(async () => {
            const health = await getHealth();
            resolve({
              success: health.status === 'online',
              health
            });
          }, 2000);
        }
      });
    });
  });
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'set-state' && args.length >= 3) {
    const state = args[1];
    const message = args.slice(2).join(' ');
    setState(state, message)
      .then(result => {
        console.log(`✅ ${result.output}`);
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ 状态更新失败:', err.message);
        process.exit(1);
      });
  } else if (command === 'health') {
    getHealth()
      .then(health => {
        console.log('🏥 服务状态:', health.status === 'online' ? '✅ 运行中' : '❌ 离线');
        if (health.data) console.log('健康信息:', JSON.stringify(health.data, null, 2));
        if (health.raw) console.log('原始响应:', health.raw);
        process.exit(0);
      });
  } else if (command === 'restart') {
    console.log('🔄 正在重启 Star Office UI 服务...');
    restartService()
      .then(result => {
        if (result.success) {
          console.log('✅ 服务重启成功！');
          console.log('当前状态:', result.health.status === 'online' ? '✅ 运行中' : '❌ 离线');
        } else {
          console.log('❌ 服务重启失败');
        }
        process.exit(result.success ? 0 : 1);
      })
      .catch(err => {
        console.error('❌ 重启失败:', err.message);
        process.exit(1);
      });
  } else {
    console.log('Usage:');
    console.log('  node index.js set-state <state> <message>  # 设置状态');
    console.log('  node index.js health                       # 检查服务健康状态');
    console.log('  node index.js restart                      # 重启服务');
    console.log('');
    console.log('可用状态: writing, syncing, error, idle, researching, executing');
  }
}

module.exports = { setState, getHealth, restartService };
