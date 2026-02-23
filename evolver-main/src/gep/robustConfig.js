/**
 * PCEC 健壮的配置加载模块
 * 提供降级方案和多种配置源支持
 */

const fs = require('fs');
const path = require('path');

/**
 * 加载配置，支持多种来源和降级方案
 * @returns {Object} 配置对象
 */
function loadConfig() {
  const config = {
    hubUrl: 'https://evomap.ai',
    nodeId: null,
    loop: false,
    verbose: false
  };

  // 优先级: 环境变量 > .env 文件 > 默认值

  // 1. 尝试加载 dotenv
  let dotenvLoaded = false;
  try {
    require('dotenv').config();
    dotenvLoaded = true;
  } catch (error) {
    // dotenv 未安装，继续使用其他方法
  }

  // 2. 读取 .env 文件（手动解析）
  if (!dotenvLoaded) {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        parseEnvFile(content, process.env);
      } catch (error) {
        console.warn('[Config] 警告: 无法解析 .env 文件:', error.message);
      }
    }
  }

  // 3. 从环境变量读取配置
  config.hubUrl = process.env.A2A_HUB_URL ||
                 process.env.EVOMAP_HUB_URL ||
                 config.hubUrl;

  config.nodeId = process.env.A2A_NODE_ID || null;

  // 4. 命令行参数（最高优先级）
  const args = process.argv.slice(2);
  if (args.includes('--loop')) {
    config.loop = true;
  }
  if (args.includes('--verbose') || args.includes('-v')) {
    config.verbose = true;
  }

  // 5. 自动生成节点 ID（如果未设置）
  if (!config.nodeId) {
    const crypto = require('crypto');
    const deviceId = getDeviceId();
    const agentName = process.env.AGENT_NAME || 'default';
    const raw = deviceId + '|' + agentName + '|' + process.cwd();
    config.nodeId = 'node_' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 12);

    if (config.verbose) {
      console.log('[Config] 自动生成节点 ID:', config.nodeId);
    }
  }

  return config;
}

/**
 * 手动解析 .env 文件
 * @param {string} content - 文件内容
 * @param {Object} targetEnv - 目标环境对象
 */
function parseEnvFile(content, targetEnv) {
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过注释和空行
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // 解析 KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // 不覆盖已存在的环境变量
      if (!(key in targetEnv)) {
        targetEnv[key] = value;
      }
    }
  }
}

/**
 * 获取设备 ID
 * @returns {string} 设备 ID
 */
function getDeviceId() {
  const crypto = require('crypto');
  const os = require('os');

  // 使用机器特定信息生成稳定的设备 ID
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const cpus = os.cpus();

  let cpuInfo = '';
  if (cpus && cpus.length > 0) {
    cpuInfo = cpus[0].model;
  }

  const raw = hostname + '|' + platform + '|' + arch + '|' + cpuInfo;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * 验证配置
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果 {valid: boolean, errors: Array}
 */
function validateConfig(config) {
  const errors = [];

  // 验证 hubUrl
  try {
    new URL(config.hubUrl);
  } catch (error) {
    errors.push('hubUrl 格式无效: ' + config.hubUrl);
  }

  // 验证 nodeId
  if (typeof config.nodeId !== 'string' || !config.nodeId.startsWith('node_')) {
    errors.push('nodeId 必须是以 "node_" 开头的字符串');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 显示配置信息
 * @param {Object} config - 配置对象
 */
function displayConfig(config) {
  console.log('[Config] 配置加载完成');
  console.log('  Hub URL:', config.hubUrl);
  console.log('  节点 ID:', config.nodeId);
  console.log('  循环模式:', config.loop ? '启用' : '禁用');
  console.log('  详细输出:', config.verbose ? '启用' : '禁用');
  console.log('');
}

module.exports = {
  loadConfig,
  validateConfig,
  displayConfig
};
