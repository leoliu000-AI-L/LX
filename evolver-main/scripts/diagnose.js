#!/usr/bin/env node
/**
 * PCEC 一键诊断工具
 * 整合所有诊断功能，生成完整报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 诊断结果收集器
const diagnosis = {
  timestamp: new Date().toISOString(),
  overall: { status: 'unknown', score: 0 },
  categories: {}
};

/**
 * 执行诊断检查
 * @param {string} name - 检查名称
 * @param {Function} checkFn - 检查函数
 */
function runCheck(name, checkFn) {
  try {
    console.log(`\n🔍 ${name}...`);
    const result = checkFn();
    diagnosis.categories[name] = result;
    return result;
  } catch (error) {
    console.error(`   ❌ 检查失败: ${error.message}`);
    diagnosis.categories[name] = {
      status: 'error',
      message: error.message
    };
    return { status: 'error', message: error.message };
  }
}

/**
 * 1. 环境检查
 */
function checkEnvironment() {
  const envCheck = require('./env-check.js');

  // 重写 console.log 来捕获输出
  const originalLog = console.log;
  const output = [];

  console.log = (...args) => {
    output.push(args.join(' '));
    originalLog(...args);
  };

  try {
    envCheck.main();
  } catch (e) {
    // exit code
  }

  console.log = originalLog;

  return {
    status: 'completed',
    output: output.join('\n')
  };
}

/**
 * 2. Evolver 进程检查
 */
function checkEvolverProcess() {
  const { getProcessInfo, checkProcessHealth } = require('../src/monitor/processMonitor');

  // 读取 PID 文件
  const pidPath = path.join(process.cwd(), 'evolver.pid');
  let pid = null;

  if (fs.existsSync(pidPath)) {
    try {
      pid = parseInt(fs.readFileSync(pidPath, 'utf8'));
    } catch (error) {
      // ignore
    }
  }

  if (!pid) {
    return {
      status: 'warning',
      message: 'Evolver 未运行',
      recommendation: '运行: node index.js --loop'
    };
  }

  const health = checkProcessHealth(pid);

  return {
    status: health.healthy ? 'ok' : 'warning',
    pid: pid,
    health: health,
    message: health.healthy ? 'Evolver 运行正常' : `问题: ${health.issues.join(', ')}`
  };
}

/**
 * 3. EvoMap 节点检查
 */
function checkEvoMapNode() {
  const https = require('https');

  return new Promise((resolve) => {
    const nodeId = process.env.A2A_NODE_ID || 'node_514d17ec9eaa04a4';

    const options = {
      hostname: 'evomap.ai',
      port: 443,
      path: `/a2a/nodes/${nodeId}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const nodeInfo = JSON.parse(data);
            resolve({
              status: nodeInfo.online ? 'ok' : 'warning',
              nodeId: nodeId,
              online: nodeInfo.online,
              lastSeen: nodeInfo.last_seen_at,
              reputation: nodeInfo.reputation_score,
              published: nodeInfo.total_published,
              message: nodeInfo.online ? '节点在线' : '节点离线'
            });
          } catch (e) {
            resolve({
              status: 'error',
              message: '解析节点信息失败'
            });
          }
        } else {
          resolve({
            status: 'error',
            message: `HTTP ${res.statusCode}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 'error',
        message: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: 'error',
        message: '请求超时'
      });
    });

    req.end();
  });
}

/**
 * 4. 系统资源检查
 */
function checkSystemResources() {
  const os = require('os');

  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    status: 'ok',
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    cpus: {
      count: cpus.length,
      model: cpus[0]?.model || 'unknown'
    },
    memory: {
      total: Math.round(totalMem / 1024 / 1024 / 1024),
      used: Math.round(usedMem / 1024 / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024 / 1024),
      percent: Math.round((usedMem / totalMem) * 100)
    },
    uptime: Math.round(os.uptime() / 60), // 分钟
    message: '系统资源正常'
  };
}

/**
 * 5. 文件系统检查
 */
function checkFileSystem() {
  const checks = [];

  // 检查关键目录
  const dirs = ['.', 'assets', 'assets/gep', 'logs', 'src'];
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      checks.push({ dir: dir, exists: true });
    } else {
      checks.push({ dir: dir, exists: false });
    }
  }

  // 检查磁盘空间
  const stats = fs.statSync('.');

  return {
    status: 'ok',
    directories: checks,
    message: '文件系统正常'
  };
}

/**
 * 6. 日志文件检查
 */
function checkLogs() {
  const logsDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logsDir)) {
    return {
      status: 'warning',
      message: '日志目录不存在'
    };
  }

  const files = fs.readdirSync(logsDir);
  const logFiles = [];

  for (const file of files) {
    const filePath = path.join(logsDir, file);
    try {
      const stats = fs.statSync(filePath);
      logFiles.push({
        name: file,
        size: stats.size,
        modified: stats.mtime
      });
    } catch (error) {
      // ignore
    }
  }

  // 检查是否有超大日志文件
  const largeLogs = logFiles.filter(f => f.size > 10 * 1024 * 1024); // > 10MB

  return {
    status: largeLogs.length > 0 ? 'warning' : 'ok',
    logFiles: logFiles,
    largeLogs: largeLogs,
    message: largeLogs.length > 0
      ? `发现 ${largeLogs.length} 个大日志文件`
      : '日志文件正常'
  };
}

/**
 * 7. 网络连接检查
 */
function checkNetwork() {
  try {
    // 测试 DNS 解析
    const dns = require('dns');

    return new Promise((resolve) => {
      dns.lookup('evomap.ai', (err, address) => {
        if (err) {
          resolve({
            status: 'error',
            message: 'DNS 解析失败',
            error: err.message
          });
        } else {
          resolve({
            status: 'ok',
            address: address,
            message: '网络连接正常'
          });
        }
      });
    });
  } catch (error) {
    return {
      status: 'error',
      message: '网络检查失败',
      error: error.message
    };
  }
}

/**
 * 8. 依赖检查
 */
function checkDependencies() {
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return {
      status: 'warning',
      message: 'package.json 不存在'
    };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const dependencies = pkg.dependencies || {};

    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const missing = [];
    const installed = [];

    for (const dep of Object.keys(dependencies)) {
      if (fs.existsSync(path.join(nodeModulesPath, dep))) {
        installed.push(dep);
      } else {
        missing.push(dep);
      }
    }

    return {
      status: missing.length === 0 ? 'ok' : 'warning',
      installed: installed.length,
      missing: missing,
      message: missing.length === 0
        ? `所有 ${installed.length} 个依赖已安装`
        : `缺少 ${missing.length} 个依赖`
    };
  } catch (error) {
    return {
      status: 'error',
      message: '解析 package.json 失败',
      error: error.message
    };
  }
}

/**
 * 计算总体评分
 */
function calculateScore() {
  let score = 0;
  let maxScore = 0;
  const issues = [];
  const warnings = [];

  for (const [name, result] of Object.entries(diagnosis.categories)) {
    maxScore += 10;

    if (result.status === 'ok') {
      score += 10;
    } else if (result.status === 'completed') {
      score += 10;
    } else if (result.status === 'warning') {
      score += 5;
      warnings.push(`${name}: ${result.message}`);
    } else if (result.status === 'error') {
      score += 0;
      issues.push(`${name}: ${result.message}`);
    }
  }

  const percent = Math.round((score / maxScore) * 100);

  return {
    score: score,
    maxScore: maxScore,
    percent: percent,
    status: percent >= 80 ? 'healthy' : (percent >= 50 ? 'warning' : 'critical'),
    issues: issues,
    warnings: warnings
  };
}

/**
 * 生成诊断报告
 */
function generateReport() {
  const score = calculateScore();

  const report = {
    timestamp: diagnosis.timestamp,
    summary: score,
    categories: diagnosis.categories,
    recommendations: generateRecommendations(score)
  };

  return report;
}

/**
 * 生成修复建议
 */
function generateRecommendations(score) {
  const recommendations = [];

  // 基于问题生成建议
  for (const [name, result] of Object.entries(diagnosis.categories)) {
    if (result.status === 'warning' || result.status === 'error') {
      if (result.recommendation) {
        recommendations.push(result.recommendation);
      }
    }
  }

  // 通用建议
  if (score.percent < 100) {
    recommendations.push('运行: node scripts/diagnose.js --auto-fix');
  }

  return recommendations;
}

/**
 * 自动修复
 */
function autoFix() {
  console.log('\n🔧 自动修复模式...\n');

  const fixes = [];

  // 修复 1: 清理 PID 文件
  const pidPath = path.join(process.cwd(), 'evolver.pid');
  if (fs.existsSync(pidPath)) {
    try {
      const pid = parseInt(fs.readFileSync(pidPath, 'utf8'));
      const { isProcessRunning } = require('../src/monitor/smartProcessManager');

      if (!isProcessRunning(pid)) {
        fs.unlinkSync(pidPath);
        fixes.push('清理僵尸 PID 文件');
      }
    } catch (error) {
      // ignore
    }
  }

  // 修复 2: 创建日志目录
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    fixes.push('创建日志目录');
  }

  // 修复 3: 创建 assets 目录
  const assetsDirs = ['assets', 'assets/gep', 'assets/gep/genes', 'assets/gep/capsules', 'assets/gep/events'];
  for (const dir of assetsDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  fixes.push('确保 assets 目录结构完整');

  console.log(`✅ 完成 ${fixes.length} 项修复:`);
  fixes.forEach(fix => console.log(`   - ${fix}`));

  return fixes;
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 PCEC 一键诊断工具');
  console.log('='.repeat(60));
  console.log('');

  // 解析参数
  const args = process.argv.slice(2);
  const autoFix = args.includes('--auto-fix');
  const jsonOutput = args.includes('--json');

  if (autoFix) {
    autoFix();
    console.log('');
  }

  // 运行所有检查
  await runCheck('环境检查', checkEnvironment);
  await runCheck('Evolver 进程', checkEvolverProcess);
  await runCheck('EvoMap 节点', await checkEvoMapNode());
  await runCheck('系统资源', checkSystemResources);
  await runCheck('文件系统', checkFileSystem);
  await runCheck('日志文件', checkLogs);
  await runCheck('网络连接', await checkNetwork());
  await runCheck('依赖检查', checkDependencies());

  // 计算评分
  const score = calculateScore();
  diagnosis.overall = score;

  // 显示结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 诊断结果');
  console.log('='.repeat(60));
  console.log('');
  console.log(`📈 健康得分: ${score.percent}%`);
  console.log(`状态: ${score.status.toUpperCase()}`);
  console.log('');

  if (score.issues.length > 0) {
    console.log('❌ 问题:');
    score.issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  }

  if (score.warnings.length > 0) {
    console.log('⚠️  警告:');
    score.warnings.forEach(warning => console.log(`   - ${warning}`));
    console.log('');
  }

  if (score.percent === 100) {
    console.log('🎉 系统状态完美！');
  } else if (score.percent >= 80) {
    console.log('✅ 系统状态良好');
  } else if (score.percent >= 50) {
    console.log('⚠️  系统状态一般，建议修复');
  } else {
    console.log('❌ 系统状态较差，需要立即修复');
  }

  // 生成报告
  const report = generateReport();

  if (jsonOutput) {
    console.log('');
    console.log('📄 JSON 报告:');
    console.log(JSON.stringify(report, null, 2));
  }

  // 保存报告
  const reportPath = path.join(process.cwd(), 'logs', 'diagnosis-' + Date.now() + '.json');
  try {
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('');
    console.log(`📄 报告已保存: ${reportPath}`);
  } catch (error) {
    console.error('保存报告失败:', error.message);
  }

  console.log('');

  // 返回退出码
  process.exit(score.status === 'critical' ? 1 : 0);
}

// 运行
main().catch(error => {
  console.error('诊断失败:', error);
  process.exit(1);
});
