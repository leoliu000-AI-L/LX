/**
 * PCEC Token 安全管理器
 * 基于 OpenClaw 安全最佳实践
 */

const fs = require('fs');
const path = require('path');

/**
 * Token 管理器
 */
class TokenManager {
  constructor(options = {}) {
    this.envPath = options.envPath || path.join(process.cwd(), '.env');
    this.enabled = options.enabled !== false;
    this.strictMode = options.strictMode || true;
  }

  /**
   * 从环境变量获取 Token
   * @param {string} tokenName - Token 名称
   * @returns {string|null} Token 值
   */
  getToken(tokenName) {
    if (!this.enabled) {
      console.warn('[TokenManager] Token 管理器已禁用');
      return null;
    }

    // 优先从环境变量读取
    const envValue = process.env[tokenName];
    if (envValue) {
      return envValue;
    }

    // 如果环境变量没有，尝试从 .env 文件读取
    try {
      if (fs.existsSync(this.envPath)) {
        const envContent = fs.readFileSync(this.envPath, 'utf8');
        const lines = envContent.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith(tokenName + '=')) {
            const value = trimmed.substring(tokenName.length + 1).trim();
            // 移除引号
            return value.replace(/^["']|["']$/g, '');
          }
        }
      }
    } catch (error) {
      console.error('[TokenManager] 读取 .env 文件失败:', error.message);
    }

    return null;
  }

  /**
   * 设置 Token 到 .env 文件
   * @param {string} tokenName - Token 名称
   * @param {string} tokenValue - Token 值
   * @returns {boolean} 是否成功
   */
  setToken(tokenName, tokenValue) {
    try {
      let envContent = '';

      // 读取现有内容
      if (fs.existsSync(this.envPath)) {
        envContent = fs.readFileSync(this.envPath, 'utf8');
      }

      // 检查是否已存在
      const lines = envContent.split('\n');
      let found = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith(tokenName + '=')) {
          lines[i] = `${tokenName}=${tokenValue}`;
          found = true;
          break;
        }
      }

      if (!found) {
        lines.push(`${tokenName}=${tokenValue}`);
      }

      // 写回文件
      fs.writeFileSync(this.envPath, lines.join('\n') + '\n');

      // 记录审计日志
      this.logTokenOperation('set', tokenName);

      return true;
    } catch (error) {
      console.error('[TokenManager] 设置 Token 失败:', error.message);
      return false;
    }
  }

  /**
   * 删除 Token
   * @param {string} tokenName - Token 名称
   * @returns {boolean} 是否成功
   */
  removeToken(tokenName) {
    try {
      if (!fs.existsSync(this.envPath)) {
        return true;
      }

      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const lines = envContent.split('\n');

      const filtered = lines.filter(line =>
        !line.trim().startsWith(tokenName + '=')
      );

      fs.writeFileSync(this.envPath, filtered.join('\n'));

      // 记录审计日志
      this.logTokenOperation('remove', tokenName);

      return true;
    } catch (error) {
      console.error('[TokenManager] 删除 Token 失败:', error.message);
      return false;
    }
  }

  /**
   * 验证 Token 安全性
   * @param {string} tokenName - Token 名称
   * @param {string} tokenValue - Token 值
   * @returns {Object} 验证结果
   */
  validateToken(tokenName, tokenValue) {
    const issues = [];

    // 检查是否为空
    if (!tokenValue) {
      issues.push('Token 值为空');
      return { valid: false, issues };
    }

    // 检查长度
    if (tokenValue.length < 16) {
      issues.push('Token 长度过短，可能不安全');
    }

    // 检查是否包含敏感词
    const sensitiveKeywords = ['password', 'secret', 'key'];
    if (sensitiveKeywords.some(keyword =>
      tokenName.toLowerCase().includes(keyword))) {
      issues.push('Token 名称包含敏感关键词');
    }

    // 检查是否是常见示例
    const examples = ['example', 'test', 'demo', 'sample', 'your_token_here'];
    if (examples.some(example =>
      tokenValue.toLowerCase().includes(example))) {
      issues.push('Token 可能是示例值，未配置真实值');
    }

    // 检查是否硬编码在文件中（除了 .env）
    const codeFiles = this.findCodeFiles();
    const hardcodedIn = this.checkHardcoded(tokenValue, codeFiles);

    if (hardcodedIn.length > 0) {
      issues.push(`Token 硬编码在文件中: ${hardcodedIn.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * 查找代码文件
   * @returns {Array} 文件列表
   */
  findCodeFiles() {
    const extensions = ['.js', '.json', '.ts', '.py'];
    const files = [];

    const searchDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // 跳过 node_modules 和 .git
            if (!item.startsWith('.') && item !== 'node_modules') {
              searchDir(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext) && item !== '.env') {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
    };

    searchDir(process.cwd());
    return files;
  }

  /**
   * 检查 Token 是否硬编码
   * @param {string} tokenValue - Token 值
   * @param {Array} files - 文件列表
   * @returns {Array} 包含 Token 的文件列表
   */
  checkHardcoded(tokenValue, files) {
    const foundIn = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(tokenValue) && content.length < 100000) {
          // 检查是否在引号中（字符串）
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.includes(tokenValue) &&
                (line.includes('"') || line.includes("'"))) {
              foundIn.push(filePath);
              break;
            }
          }
        }
      } catch (error) {
        // 忽略读取错误
      }
    }

    return foundIn;
  }

  /**
   * 记录 Token 操作
   * @param {string} operation - 操作类型
   * @param {string} tokenName - Token 名称
   */
  logTokenOperation(operation, tokenName) {
    try {
      const auditLogPath = path.join(process.cwd(), 'logs/security-audit.jsonl');
      const logDir = path.dirname(auditLogPath);

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'token_operation',
        operation: operation,
        token_name: tokenName,
        user: 'admin',
        context: {
          cwd: process.cwd()
        }
      };

      fs.appendFileSync(auditLogPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[TokenManager] 记录审计日志失败:', error.message);
    }
  }

  /**
   * 生成安全报告
   * @returns {Object} 安全报告
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };

    // 检查常见 Token
    const commonTokens = [
      'A2A_NODE_ID',
      'A2A_HUB_URL',
      'EVOMAP_TOKEN',
      'GITHUB_TOKEN',
      'API_TOKEN'
    ];

    for (const tokenName of commonTokens) {
      const tokenValue = this.getToken(tokenName);
      const check = {
        token_name: tokenName,
        exists: !!tokenValue,
        validation: tokenValue ? this.validateToken(tokenName, tokenValue) : null
      };

      report.checks.push(check);
      report.summary.total++;

      if (tokenValue) {
        const validation = this.validateToken(tokenName, tokenValue);
        if (validation.valid) {
          report.summary.passed++;
        } else {
          report.summary.failed++;
        }
      }
    }

    return report;
  }

  /**
   * 安全获取 Token（带验证）
   * @param {string} tokenName - Token 名称
   * @returns {Object} Token 和验证结果
   */
  getSecureToken(tokenName) {
    const token = this.getToken(tokenName);

    if (!token) {
      return {
        success: false,
        token: null,
        error: 'Token 不存在'
      };
    }

    const validation = this.validateToken(tokenName, token);

    if (!validation.valid && this.strictMode) {
      return {
        success: false,
        token: null,
        error: 'Token 验证失败',
        issues: validation.issues
      };
    }

    return {
      success: true,
      token: token,
      validation: validation
    };
  }

  /**
   * 检查是否有硬编码 Token
   * @returns {Object} 检查结果
   */
  checkHardcodedTokens() {
    const codeFiles = this.findCodeFiles();
    const findings = [];

    // 常见 Token 模式
    const patterns = [
      /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      /api[_-]?key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
      /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi
    ];

    for (const filePath of codeFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            findings.push({
              file: filePath,
              matches: matches.length,
              pattern: pattern.toString()
            });
            break;
          }
        }
      } catch (error) {
        // 忽略读取错误
      }
    }

    return {
      has_hardcoded_tokens: findings.length > 0,
      findings: findings,
      recommendations: findings.length > 0 ? [
        '将硬编码的 Token 移到 .env 文件',
        '使用环境变量存储敏感配置',
        '将 .env 添加到 .gitignore'
      ] : []
    };
  }
}

/**
 * 创建 Token 管理器
 * @param {Object} options - 选项
 * @returns {TokenManager} Token 管理器实例
 */
function createTokenManager(options = {}) {
  return new TokenManager(options);
}

module.exports = {
  TokenManager,
  createTokenManager
};
