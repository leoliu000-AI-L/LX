#!/usr/bin/env node
/**
 * PCEC 环境健康检查工具
 * 检查 Evolver 运行所需的依赖和配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 PCEC 环境健康检查');
console.log('='.repeat(60));
console.log('');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// 1. 检查 Node.js 版本
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);

  if (major >= 18) {
    results.passed.push({
      check: 'Node.js 版本',
      status: '✅',
      message: `v${version} (满足 >= v18 要求)`
    });
  } else {
    results.failed.push({
      check: 'Node.js 版本',
      status: '❌',
      message: `v${version} (需要 >= v18)`,
      fix: '请升级 Node.js 到 v18 或更高版本'
    });
  }
}

// 2. 检查工作目录
function checkWorkingDirectory() {
  const cwd = process.cwd();

  if (cwd.includes('evolver-main') || fs.existsSync(path.join(cwd, 'package.json'))) {
    results.passed.push({
      check: '工作目录',
      status: '✅',
      message: cwd
    });
  } else {
    results.warnings.push({
      check: '工作目录',
      status: '⚠️',
      message: `当前不在 evolver-main 目录: ${cwd}`,
      fix: '请 cd 到 evolver-main 目录'
    });
  }
}

// 3. 检查 package.json 依赖
function checkDependencies() {
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    results.failed.push({
      check: 'package.json',
      status: '❌',
      message: '未找到 package.json',
      fix: '请确保在 evolver-main 目录中运行'
    });
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const dependencies = pkg.dependencies || {};
    const devDependencies = pkg.devDependencies || {};
    const allDeps = { ...dependencies, ...devDependencies };

    const nodeModulesPath = path.join(process.cwd(), 'node_modules');

    let missingDeps = [];
    for (const dep of Object.keys(allDeps)) {
      if (!fs.existsSync(path.join(nodeModulesPath, dep))) {
        missingDeps.push(dep);
      }
    }

    if (missingDeps.length === 0) {
      results.passed.push({
        check: '依赖安装',
        status: '✅',
        message: `所有 ${Object.keys(allDeps).length} 个依赖已安装`
      });
    } else {
      results.warnings.push({
        check: '依赖安装',
        status: '⚠️',
        message: `缺少 ${missingDeps.length} 个依赖: ${missingDeps.slice(0, 3).join(', ')}${missingDeps.length > 3 ? '...' : ''}`,
        fix: '运行: npm install'
      });
    }
  } catch (error) {
    results.failed.push({
      check: 'package.json',
      status: '❌',
      message: `解析失败: ${error.message}`,
      fix: '检查 package.json 格式'
    });
  }
}

// 4. 检查 dotenv
function checkDotenv() {
  try {
    require.resolve('dotenv');
    results.passed.push({
      check: 'dotenv 模块',
      status: '✅',
      message: '已安装'
    });
  } catch (error) {
    results.warnings.push({
      check: 'dotenv 模块',
      status: '⚠️',
      message: '未安装，配置加载将使用降级方案',
      fix: '运行: npm install dotenv --save'
    });
  }
}

// 5. 检查 .env 文件
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    results.passed.push({
      check: '.env 文件',
      status: '✅',
      message: `找到 ${lines.length} 个配置项`
    });

    // 检查关键配置
    const hasHubUrl = content.includes('A2A_HUB_URL') || content.includes('EVOMAP_HUB_URL');
    const hasNodeId = content.includes('A2A_NODE_ID');

    if (!hasHubUrl) {
      results.warnings.push({
        check: 'A2A_HUB_URL',
        status: '⚠️',
        message: '未在 .env 中配置，将使用默认值',
        fix: '添加: A2A_HUB_URL=https://evomap.ai'
      });
    }

    if (!hasNodeId) {
      results.warnings.push({
        check: 'A2A_NODE_ID',
        status: '⚠️',
        message: '未在 .env 中配置，将自动生成',
        fix: '添加: A2A_NODE_ID=your_node_id'
      });
    }
  } else {
    results.warnings.push({
      check: '.env 文件',
      status: '⚠️',
      message: '不存在，将使用环境变量或默认值',
      fix: '创建 .env 文件并添加配置'
    });
  }
}

// 6. 检查环境变量
function checkEnvironmentVariables() {
  const hubUrl = process.env.A2A_HUB_URL || process.env.EVOMAP_HUB_URL;
  const nodeId = process.env.A2A_NODE_ID;

  if (hubUrl) {
    results.passed.push({
      check: 'A2A_HUB_URL',
      status: '✅',
      message: hubUrl
    });
  } else {
    results.warnings.push({
      check: 'A2A_HUB_URL',
      status: '⚠️',
      message: '未设置，将使用默认值: https://evomap.ai',
      fix: 'export A2A_HUB_URL=https://evomap.ai'
    });
  }

  if (nodeId) {
    results.passed.push({
      check: 'A2A_NODE_ID',
      status: '✅',
      message: nodeId
    });
  } else {
    results.warnings.push({
      check: 'A2A_NODE_ID',
      status: '⚠️',
      message: '未设置，将自动生成节点 ID',
      fix: 'export A2A_NODE_ID=your_node_id'
    });
  }
}

// 7. 检查 PID 文件
function checkPidFile() {
  const pidPath = path.join(process.cwd(), 'evolver.pid');

  if (fs.existsSync(pidPath)) {
    try {
      const pid = parseInt(fs.readFileSync(pidPath, 'utf8'));
      results.warnings.push({
        check: 'PID 文件',
        status: '⚠️',
        message: `存在 (PID: ${pid})，可能需要清理`,
        fix: '运行: rm -f evolver.pid 或检查进程是否在运行'
      });
    } catch (error) {
      results.failed.push({
        check: 'PID 文件',
        status: '❌',
        message: `损坏: ${error.message}`,
        fix: '运行: rm -f evolver.pid'
      });
    }
  } else {
    results.passed.push({
      check: 'PID 文件',
      status: '✅',
      message: '不存在（正常）'
    });
  }
}

// 8. 检查网络连接
function checkNetworkConnection() {
  try {
    const https = require('https');
    // 简单检查，不实际请求
    results.passed.push({
      check: 'HTTPS 模块',
      status: '✅',
      message: '可用'
    });
  } catch (error) {
    results.failed.push({
      check: 'HTTPS 模块',
      status: '❌',
      message: '不可用',
      fix: '检查 Node.js 安装'
    });
  }
}

// 执行所有检查
function runAllChecks() {
  checkNodeVersion();
  checkWorkingDirectory();
  checkDependencies();
  checkDotenv();
  checkEnvFile();
  checkEnvironmentVariables();
  checkPidFile();
  checkNetworkConnection();
}

// 显示结果
function displayResults() {
  console.log('📊 检查结果');
  console.log('='.repeat(60));
  console.log('');

  // 通过的检查
  if (results.passed.length > 0) {
    console.log('✅ 通过 (' + results.passed.length + ')');
    results.passed.forEach(r => {
      console.log(`   ${r.status} ${r.check}: ${r.message}`);
    });
    console.log('');
  }

  // 警告
  if (results.warnings.length > 0) {
    console.log('⚠️  警告 (' + results.warnings.length + ')');
    results.warnings.forEach(r => {
      console.log(`   ${r.status} ${r.check}: ${r.message}`);
      if (r.fix) {
        console.log(`   💡 修复: ${r.fix}`);
      }
    });
    console.log('');
  }

  // 失败
  if (results.failed.length > 0) {
    console.log('❌ 失败 (' + results.failed.length + ')');
    results.failed.forEach(r => {
      console.log(`   ${r.status} ${r.check}: ${r.message}`);
      if (r.fix) {
        console.log(`   💡 修复: ${r.fix}`);
      }
    });
    console.log('');
  }

  // 总结
  console.log('='.repeat(60));
  const total = results.passed.length + results.warnings.length + results.failed.length;
  const score = Math.round((results.passed.length / total) * 100);

  console.log('');
  console.log('📈 健康得分: ' + score + '%');

  if (results.failed.length === 0 && results.warnings.length === 0) {
    console.log('🎉 环境完美！可以启动 Evolver');
  } else if (results.failed.length === 0) {
    console.log('✅ 环境良好，可以启动 Evolver（建议修复警告）');
  } else {
    console.log('⚠️  存在问题，建议修复后再启动');
  }

  console.log('');
}

// 主函数
function main() {
  runAllChecks();
  displayResults();

  // 返回退出码
  const exitCode = results.failed.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

main();
