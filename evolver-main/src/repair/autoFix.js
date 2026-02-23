/**
 * PCEC 自动修复模块
 * 检测并自动修复常见问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 修复项定义
 */
const FIXES = {
  cleanPidFile: {
    name: '清理僵尸 PID 文件',
    priority: 'high',
    check: () => {
      const pidPath = path.join(process.cwd(), 'evolver.pid');
      if (!fs.existsSync(pidPath)) {
        return { needed: false };
      }

      try {
        const pid = parseInt(fs.readFileSync(pidPath, 'utf8'));
        const { isProcessRunning } = require('../monitor/smartProcessManager');

        if (!isProcessRunning(pid)) {
          return { needed: true, reason: `僵尸 PID 文件 (PID: ${pid})` };
        }
      } catch (error) {
        return { needed: true, reason: 'PID 文件损坏' };
      }

      return { needed: false };
    },
    fix: () => {
      const pidPath = path.join(process.cwd(), 'evolver.pid');
      fs.unlinkSync(pidPath);
      return { success: true, message: '已清理僵尸 PID 文件' };
    }
  },

  createLogDirectory: {
    name: '创建日志目录',
    priority: 'medium',
    check: () => {
      const logsDir = path.join(process.cwd(), 'logs');
      return { needed: !fs.existsSync(logsDir) };
    },
    fix: () => {
      const logsDir = path.join(process.cwd(), 'logs');
      fs.mkdirSync(logsDir, { recursive: true });
      return { success: true, message: '已创建日志目录' };
    }
  },

  createAssetDirectories: {
    name: '创建资产目录',
    priority: 'medium',
    check: () => {
      const dirs = ['assets', 'assets/gep', 'assets/gep/genes', 'assets/gep/capsules', 'assets/gep/events'];
      const missing = dirs.filter(d => !fs.existsSync(d));
      return { needed: missing.length > 0, missing: missing };
    },
    fix: (checkResult) => {
      const dirs = checkResult.missing || ['assets', 'assets/gep', 'assets/gep/genes', 'assets/gep/capsules', 'assets/gep/events'];
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      return { success: true, message: `已创建 ${dirs.length} 个目录` };
    }
  },

  rotateLargeLogs: {
    name: '轮转大日志文件',
    priority: 'low',
    check: () => {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        return { needed: false };
      }

      const files = fs.readdirSync(logsDir);
      const largeFiles = [];

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile() && stats.size > 10 * 1024 * 1024) { // > 10MB
            largeFiles.push({ file, size: stats.size });
          }
        } catch (error) {
          // ignore
        }
      }

      return { needed: largeFiles.length > 0, files: largeFiles };
    },
    fix: (checkResult) => {
      const logsDir = path.join(process.cwd(), 'logs');
      const largeFiles = checkResult.files || [];

      const rotated = [];
      for (const { file } of largeFiles) {
        const oldPath = path.join(logsDir, file);
        const newPath = path.join(logsDir, `${file}.${Date.now()}.old`);

        try {
          fs.renameSync(oldPath, newPath);
          rotated.push(file);
        } catch (error) {
          // skip
        }
      }

      return { success: true, message: `已轮转 ${rotated.length} 个日志文件` };
    }
  },

  installMissingDependencies: {
    name: '安装缺失依赖',
    priority: 'high',
    check: () => {
      const pkgPath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(pkgPath)) {
        return { needed: false };
      }

      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
        const nodeModulesPath = path.join(process.cwd(), 'node_modules');

        const missing = [];
        for (const dep of Object.keys(dependencies)) {
          if (!fs.existsSync(path.join(nodeModulesPath, dep))) {
            missing.push(dep);
          }
        }

        return { needed: missing.length > 0, missing: missing };
      } catch (error) {
        return { needed: false };
      }
    },
    fix: async (checkResult) => {
      const missing = checkResult.missing || [];

      try {
        // 尝试使用 npm
        execSync('npm install', { cwd: process.cwd(), stdio: 'inherit' });
        return { success: true, message: `已安装 ${missing.length} 个依赖` };
      } catch (error) {
        return { success: false, message: 'npm install 失败', error: error.message };
      }
    }
  },

  resetEvolverConfig: {
    name: '重置 Evolver 配置',
    priority: 'low',
    check: () => {
      // 检查配置是否损坏
      try {
        const { loadConfig, validateConfig } = require('../gep/robustConfig');
        const config = loadConfig();
        const validation = validateConfig(config);
        return { needed: !validation.valid, errors: validation.errors };
      } catch (error) {
        return { needed: true, error: error.message };
      }
    },
    fix: () => {
      // 使用默认配置
      const config = {
        hubUrl: 'https://evomap.ai',
        nodeId: null,
        loop: false
      };
      return { success: true, message: '已重置为默认配置' };
    }
  }
};

/**
 * 执行自动修复
 * @param {Object} options - 选项
 * @returns {Object} 修复结果
 */
async function autoFix(options = {}) {
  const {
    fixes = null, // null = 所有修复
    dryRun = false,
    verbose = false
  } = options;

  const results = [];
  const fixesToRun = fixes || Object.keys(FIXES);

  console.log('🔧 PCEC 自动修复');
  console.log('='.repeat(60));
  console.log('');

  for (const fixKey of fixesToRun) {
    const fix = FIXES[fixKey];
    if (!fix) {
      console.log(`⚠️  未知修复: ${fixKey}`);
      continue;
    }

    try {
      console.log(`🔍 检查: ${fix.name}...`);

      const checkResult = fix.check();

      if (!checkResult.needed) {
        console.log(`   ✅ 无需修复`);
        continue;
      }

      console.log(`   ⚠️  需要修复: ${checkResult.reason || fix.name}`);

      if (dryRun) {
        console.log(`   [DRY RUN] 将执行修复`);
        results.push({
          fix: fixKey,
          name: fix.name,
          needed: true,
          dryRun: true
        });
        continue;
      }

      // 执行修复
      const fixResult = await fix.fix(checkResult);

      if (fixResult.success) {
        console.log(`   ✅ ${fixResult.message}`);
        results.push({
          fix: fixKey,
          name: fix.name,
          success: true,
          message: fixResult.message
        });
      } else {
        console.log(`   ❌ ${fixResult.message || '修复失败'}`);
        results.push({
          fix: fixKey,
          name: fix.name,
          success: false,
          message: fixResult.message
        });
      }
    } catch (error) {
      console.log(`   ❌ 修复失败: ${error.message}`);
      results.push({
        fix: fixKey,
        name: fix.name,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  // 总结
  console.log('='.repeat(60));
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log('');
  console.log(`📊 修复完成: ${successCount}/${totalCount} 成功`);
  console.log('');

  if (totalCount === 0) {
    console.log('🎉 无需修复，系统状态良好！');
  } else if (successCount === totalCount) {
    console.log('✅ 所有修复已成功应用');
  } else {
    console.log('⚠️  部分修复失败，请检查错误信息');
  }

  return {
    total: totalCount,
    success: successCount,
    failed: totalCount - successCount,
    results: results
  };
}

/**
 * 获取可用修复列表
 * @returns {Array} 修复列表
 */
function listFixes() {
  return Object.keys(FIXES).map(key => ({
    key: key,
    name: FIXES[key].name,
    priority: FIXES[key].priority
  }));
}

module.exports = {
  FIXES,
  autoFix,
  listFixes
};
