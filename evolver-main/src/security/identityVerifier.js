/**
 * PCEC 身份验证系统
 * 基于 OpenClaw 安全最佳实践
 */

const fs = require('fs');
const path = require('path');

/**
 * 身份验证器
 */
class IdentityVerifier {
  constructor(options = {}) {
    this.trustedUsersPath = options.trustedUsersPath ||
      path.join(process.cwd(), 'TRUSTED_USERS.md');
    this.enabled = options.enabled !== false;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 60000; // 1 minute
  }

  /**
   * 加载可信用户列表
   */
  loadTrustedUsers() {
    if (!fs.existsSync(this.trustedUsersPath)) {
      return {
        supreme_admin: null,
        co_admins: [],
        users: []
      };
    }

    try {
      const content = fs.readFileSync(this.trustedUsersPath, 'utf8');
      return this.parseTrustedUsers(content);
    } catch (error) {
      console.error('[IdentityVerifier] 加载可信用户列表失败:', error.message);
      return {
        supreme_admin: null,
        co_admins: [],
        users: []
      };
    }
  }

  /**
   * 解析 TRUSTED_USERS.md
   */
  parseTrustedUsers(content) {
    const users = {
      supreme_admin: null,
      co_admins: [],
      users: []
    };

    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // 检测章节
      if (trimmed.startsWith('##')) {
        currentSection = trimmed.replace('##', '').trim().toLowerCase();
        continue;
      }

      // 解析用户 ID
      const match = trimmed.match(/`([^`]+)`/);
      if (match) {
        const userId = match[1];
        const role = this.extractRole(trimmed);

        if (currentSection.includes('管理员')) {
          if (trimmed.includes('唯一最高管理员')) {
            users.supreme_admin = userId;
          } else if (trimmed.includes('联合管理员')) {
            users.co_admins.push(userId);
          }
        }

        users.users.push({
          id: userId,
          role: role,
          raw: trimmed
        });
      }
    }

    return users;
  }

  /**
   * 提取角色信息
   */
  extractRole(line) {
    if (line.includes('唯一最高管理员')) return 'supreme_admin';
    if (line.includes('联合管理员')) return 'co_admin';
    if (line.includes('普通用户')) return 'user';
    return 'unknown';
  }

  /**
   * 验证用户身份
   * @param {string} userId - 用户 ID
   * @param {Object} metadata - 消息元数据
   * @returns {Object} 验证结果
   */
  verify(userId, metadata = {}) {
    if (!this.enabled) {
      return {
        verified: true,
        role: 'admin',
        method: 'disabled'
      };
    }

    if (!userId) {
      return {
        verified: false,
        role: 'unknown',
        reason: 'no_user_id'
      };
    }

    // 检查缓存
    const cacheKey = userId;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    // 加载可信用户
    const trustedUsers = this.loadTrustedUsers();

    // 验证身份
    let result = {
      verified: false,
      role: 'unknown',
      userId: userId
    };

    if (userId === trustedUsers.supreme_admin) {
      result = {
        verified: true,
        role: 'supreme_admin',
        permissions: ['all'],
        verification: 'automatic',
        userId: userId
      };
    } else if (trustedUsers.co_admins.includes(userId)) {
      result = {
        verified: true,
        role: 'co_admin',
        permissions: ['most', 'except_critical_config'],
        verification: 'automatic',
        userId: userId
      };
    } else {
      result = {
        verified: false,
        role: 'untrusted',
        permissions: ['read_only'],
        verification: 'manual_confirmation_required',
        userId: userId
      };
    }

    // 缓存结果
    this.cache.set(cacheKey, {
      result: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * 从消息中提取用户 ID
   * @param {Object} message - 消息对象
   * @returns {string|null} 用户 ID
   */
  extractUserId(message) {
    if (!message) return null;

    // 尝试多种元数据路径
    const paths = [
      'metadata.user_id',
      'metadata.userId',
      'metadata.from',
      'metadata.from_id',
      'from',
      'sender',
      'sender_id',
      'user',
      'user_id',
      'author',
      'author_id'
    ];

    for (const path of paths) {
      const value = this.getNestedValue(message, path);
      if (value) return value;
    }

    return null;
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) =>
      current && current[key] !== undefined ? current[key] : null, obj);
  }

  /**
   * 检查操作权限
   * @param {string} userId - 用户 ID
   * @param {string} operation - 操作类型
   * @returns {Object} 权限检查结果
   */
  checkPermission(userId, operation) {
    const identity = this.verify(userId);

    if (!identity.verified) {
      return {
        allowed: false,
        reason: 'unverified_user',
        requires_confirmation: true
      };
    }

    // 最高管理员拥有所有权限
    if (identity.role === 'supreme_admin') {
      return {
        allowed: true,
        reason: 'supreme_admin'
      };
    }

    // 联合管理员权限检查
    if (identity.role === 'co_admin') {
      const criticalOps = [
        'modify_admin_config',
        'add_admin',
        'remove_admin',
        'change_supreme_admin'
      ];

      if (criticalOps.includes(operation)) {
        return {
          allowed: false,
          reason: 'critical_operation_requires_supreme_admin',
          requires_confirmation: true
        };
      }

      return {
        allowed: true,
        reason: 'co_admin'
      };
    }

    // 未验证用户
    return {
      allowed: false,
      reason: 'insufficient_permissions',
      requires_confirmation: true
    };
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 生成验证报告
   */
  generateReport() {
    const trustedUsers = this.loadTrustedUsers();

    return {
      timestamp: new Date().toISOString(),
      verifier_status: this.enabled ? 'enabled' : 'disabled',
      supreme_admin: trustedUsers.supreme_admin || 'not_configured',
      co_admins_count: trustedUsers.co_admins.length,
      cache_size: this.cache.size,
      cache_timeout: this.cacheTimeout,
      recommendations: this.generateRecommendations(trustedUsers)
    };
  }

  /**
   * 生成建议
   */
  generateRecommendations(trustedUsers) {
    const recommendations = [];

    if (!trustedUsers.supreme_admin) {
      recommendations.push('配置唯一最高管理员 ID');
    }

    if (trustedUsers.co_admins.length === 0) {
      recommendations.push('考虑添加联合管理员');
    }

    if (!this.enabled) {
      recommendations.push('启用身份验证系统');
    }

    return recommendations;
  }
}

/**
 * 创建身份验证器
 * @param {Object} options - 选项
 * @returns {IdentityVerifier} 验证器实例
 */
function createIdentityVerifier(options = {}) {
  return new IdentityVerifier(options);
}

module.exports = {
  IdentityVerifier,
  createIdentityVerifier
};
