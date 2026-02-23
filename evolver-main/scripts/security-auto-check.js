/**
 * PCEC 自动安全检查脚本
 * 基于每小时定时任务执行
 */

const fs = require('fs');
const path = require('path');

/**
 * 安全检查器
 */
class SecurityAutoChecker {
  constructor(options = {}) {
    this.reportPath = options.reportPath ||
      path.join(process.cwd(), 'logs/security-auto-check.jsonl');
    this.verbose = options.verbose || false;
  }

  /**
   * 执行安全检查
   */
  async run() {
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      status: 'unknown'
    };

    console.log('🔒 开始执行安全自检...\n');

    // 1. 检查管理员配置完整性
    const adminCheck = await this.checkAdminConfig();
    this.addCheck(results, adminCheck);

    // 2. 检查 SOUL.md 文件
    const soulCheck = this.checkSoulFile();
    this.addCheck(results, soulCheck);

    // 3. 检查 MEMORY.md 文件
    const memoryCheck = this.checkMemoryFile();
    this.addCheck(results, memoryCheck);

    // 4. 检查 TRUSTED_USERS.md 文件
    const trustedUsersCheck = this.checkTrustedUsersFile();
    this.addCheck(results, trustedUsersCheck);

    // 5. 检查敏感操作审计日志
    const auditLogCheck = this.checkAuditLog();
    this.addCheck(results, auditLogCheck);

    // 6. 检查 Token 存储
    const tokenCheck = this.checkTokenStorage();
    this.addCheck(results, tokenCheck);

    // 7. 检查环境变量
    const envCheck = this.checkEnvironmentVariables();
    this.addCheck(results, envCheck);

    // 8. 检查依赖安全性
    const depsCheck = this.checkDependencies();
    this.addCheck(results, depsCheck);

    // 计算总结
    this.calculateSummary(results);

    // 输出结果
    this.printResults(results);

    // 保存报告
    this.saveReport(results);

    return results;
  }

  /**
   * 添加检查结果
   */
  addCheck(results, check) {
    results.checks.push(check);
    if (check.status === 'pass') {
      results.summary.passed++;
    } else if (check.status === 'fail') {
      results.summary.failed++;
    } else {
      results.summary.warnings++;
    }
    results.summary.total++;
  }

  /**
   * 计算总结
   */
  calculateSummary(results) {
    if (results.summary.failed > 0) {
      results.status = 'failed';
    } else if (results.summary.warnings > 0) {
      results.status = 'warning';
    } else {
      results.status = 'passed';
    }
  }

  /**
   * 检查管理员配置完整性
   */
  async checkAdminConfig() {
    const check = {
      name: '管理员配置完整性检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      const trustedUsersPath = path.join(process.cwd(), 'TRUSTED_USERS.md');

      if (!fs.existsSync(trustedUsersPath)) {
        check.status = 'fail';
        check.details.push('❌ TRUSTED_USERS.md 文件不存在');
        check.recommendations.push('创建 TRUSTED_USERS.md 配置管理员');
        return check;
      }

      const content = fs.readFileSync(trustedUsersPath, 'utf8');

      // 检查是否配置了最高管理员
      if (!content.includes('唯一最高管理员') || !content.includes('`')) {
        check.status = 'fail';
        check.details.push('❌ 未配置唯一最高管理员 ID');
        check.recommendations.push('在 TRUSTED_USERS.md 中配置最高管理员 ID');
        return check;
      }

      // 检查是否有占位符
      if (content.includes('[YOUR_ADMIN_ID]') || content.includes('[CO_ADMIN_ID]')) {
        check.status = 'warning';
        check.details.push('⚠️  发现占位符未替换');
        check.recommendations.push('替换所有占位符为实际值');
        return check;
      }

      check.status = 'pass';
      check.details.push('✅ 管理员配置完整');

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查 SOUL.md 文件
   */
  checkSoulFile() {
    const check = {
      name: 'SOUL.md 文件检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      const soulPath = path.join(process.cwd(), 'SOUL.md');

      if (!fs.existsSync(soulPath)) {
        check.status = 'warning';
        check.details.push('⚠️  SOUL.md 文件不存在（可选）');
        return check;
      }

      const content = fs.readFileSync(soulPath, 'utf8');

      // 检查是否包含安全规则
      if (!content.toLowerCase().includes('安全') &&
          !content.toLowerCase().includes('security')) {
        check.status = 'warning';
        check.details.push('⚠️  SOUL.md 中未找到安全规则');
        check.recommendations.push('在 SOUL.md 中添加安全规则章节');
        return check;
      }

      check.status = 'pass';
      check.details.push('✅ SOUL.md 文件检查通过');

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查 MEMORY.md 文件
   */
  checkMemoryFile() {
    const check = {
      name: 'MEMORY.md 文件检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      const memoryPath = path.join(process.cwd(), 'MEMORY.md');

      if (!fs.existsSync(memoryPath)) {
        check.status = 'warning';
        check.details.push('⚠️  MEMORY.md 文件不存在（可选）');
        return check;
      }

      const content = fs.readFileSync(memoryPath, 'utf8');

      // 检查是否包含安全自检任务
      if (!content.toLowerCase().includes('安全自检') &&
          !content.toLowerCase().includes('security')) {
        check.status = 'warning';
        check.details.push('⚠️  MEMORY.md 中未找到安全自检配置');
        check.recommendations.push('在 MEMORY.md 中添加安全自检任务');
        return check;
      }

      check.status = 'pass';
      check.details.push('✅ MEMORY.md 文件检查通过');

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查 TRUSTED_USERS.md 文件
   */
  checkTrustedUsersFile() {
    const check = {
      name: 'TRUSTED_USERS.md 文件检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      const trustedUsersPath = path.join(process.cwd(), 'TRUSTED_USERS.md');

      if (!fs.existsSync(trustedUsersPath)) {
        check.status = 'fail';
        check.details.push('❌ TRUSTED_USERS.md 文件不存在');
        check.recommendations.push('创建 TRUSTED_USERS.md 文件');
        return check;
      }

      const content = fs.readFileSync(trustedUsersPath, 'utf8');

      // 检查文件格式
      if (!content.includes('#') || !content.includes('`')) {
        check.status = 'warning';
        check.details.push('⚠️  TRUSTED_USERS.md 格式可能不正确');
        check.recommendations.push('检查文件格式是否符合模板');
        return check;
      }

      check.status = 'pass';
      check.details.push('✅ TRUSTED_USERS.md 文件检查通过');

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查审计日志
   */
  checkAuditLog() {
    const check = {
      name: '审计日志检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      const auditLogPath = path.join(process.cwd(), 'logs/security-audit.jsonl');

      if (!fs.existsSync(auditLogPath)) {
        check.status = 'warning';
        check.details.push('⚠️  审计日志文件不存在');
        check.recommendations.push('创建 logs/security-audit.jsonl');
        return check;
      }

      // 检查日志可读性
      const content = fs.readFileSync(auditLogPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        check.status = 'warning';
        check.details.push('⚠️  审计日志为空');
        return check;
      }

      // 验证 JSON 格式
      let validLines = 0;
      for (const line of lines) {
        try {
          JSON.parse(line);
          validLines++;
        } catch (error) {
          // 忽略无效行
        }
      }

      check.status = 'pass';
      check.details.push(`✅ 审计日志检查通过 (${validLines} 条记录)`);

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查 Token 存储
   */
  checkTokenStorage() {
    const check = {
      name: 'Token 存储安全检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      // 检查常见的不安全存储位置
      const unsafePaths = [
        'config.json',
        'secrets.json',
        'credentials.json',
        'tokens.json'
      ];

      const foundUnsafe = [];

      for (const filePath of unsafePaths) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');

          // 检查是否包含 token 或 password
          if (content.toLowerCase().includes('token') ||
              content.toLowerCase().includes('password')) {
            foundUnsafe.push(filePath);
          }
        }
      }

      if (foundUnsafe.length > 0) {
        check.status = 'fail';
        check.details.push(`❌ 发现可能的 Token 硬编码: ${foundUnsafe.join(', ')}`);
        check.recommendations.push('将 Token 移到环境变量或 .env 文件');
        return check;
      }

      // 检查 .env 文件
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');

        if (envContent.includes('token') || envContent.includes('TOKEN')) {
          check.status = 'pass';
          check.details.push('✅ Token 使用环境变量存储');
        } else {
          check.status = 'warning';
          check.details.push('⚠️  .env 文件存在但未找到 Token 配置');
        }
      } else {
        check.status = 'warning';
        check.details.push('⚠️  .env 文件不存在');
        check.recommendations.push('创建 .env 文件存储敏感配置');
      }

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查环境变量
   */
  checkEnvironmentVariables() {
    const check = {
      name: '环境变量检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      // 检查关键环境变量
      const requiredVars = [
        'A2A_NODE_ID',
        'A2A_HUB_URL'
      ];

      const missingVars = [];

      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        check.status = 'warning';
        check.details.push(`⚠️  缺少环境变量: ${missingVars.join(', ')}`);
        check.recommendations.push('设置所需的环境变量');
        return check;
      }

      check.status = 'pass';
      check.details.push('✅ 环境变量检查通过');

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 检查依赖安全性
   */
  checkDependencies() {
    const check = {
      name: '依赖安全性检查',
      status: 'unknown',
      details: [],
      recommendations: []
    };

    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        check.status = 'warning';
        check.details.push('⚠️  package.json 不存在');
        return check;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = packageJson.dependencies || {};

      if (Object.keys(deps).length === 0) {
        check.status = 'warning';
        check.details.push('⚠️  没有安装依赖');
        return check;
      }

      check.status = 'pass';
      check.details.push(`✅ 依赖检查通过 (${Object.keys(deps).length} 个依赖)`);

      // 建议
      check.recommendations.push('定期运行 npm audit 检查安全漏洞');

    } catch (error) {
      check.status = 'fail';
      check.details.push('❌ 检查失败: ' + error.message);
    }

    return check;
  }

  /**
   * 打印结果
   */
  printResults(results) {
    console.log('📊 安全自检结果\n');

    for (const check of results.checks) {
      const icon = check.status === 'pass' ? '✅' :
                   check.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${check.name}`);

      if (this.verbose || check.status !== 'pass') {
        for (const detail of check.details) {
          console.log(`   ${detail}`);
        }

        if (check.recommendations.length > 0) {
          console.log('   建议:');
          for (const rec of check.recommendations) {
            console.log(`   • ${rec}`);
          }
        }
      }
      console.log();
    }

    const statusIcon = results.status === 'passed' ? '✅' :
                      results.status === 'failed' ? '❌' : '⚠️';
    console.log(`${statusIcon} 总体状态: ${results.status.toUpperCase()}`);
    console.log(`📈 统计: ${results.summary.passed} 通过, ${results.summary.warnings} 警告, ${results.summary.failed} 失败\n`);
  }

  /**
   * 保存报告
   */
  saveReport(results) {
    try {
      const logDir = path.dirname(this.reportPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.appendFileSync(this.reportPath, JSON.stringify(results) + '\n');
    } catch (error) {
      console.error('[SecurityAutoChecker] 保存报告失败:', error.message);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const checker = new SecurityAutoChecker({
    verbose: process.argv.includes('--verbose')
  });

  const results = await checker.run();

  // 返回退出码
  if (results.status === 'failed') {
    process.exit(1);
  } else if (results.status === 'warning') {
    process.exit(2);
  }

  process.exit(0);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('安全检查失败:', error);
    process.exit(1);
  });
}

module.exports = {
  SecurityAutoChecker
};
