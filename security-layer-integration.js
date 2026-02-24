/**
 * LX-PCEC 安全层集成模块 (Phase 17)
 * 集成自 BashClaw 的 8 层安全模型
 *
 * 来源: https://github.com/shareAI-lab/BashClaw
 * 文件: lib/security.sh
 *
 * 架构:
 * Layer 1: SSRF Protection - 阻止 web_fetch 访问私有/内网 IP
 * Layer 2: Command Filters - 阻止危险命令
 * Layer 3: Pairing Codes - 6 位限时通道认证
 * Layer 4: Rate Limiting - 令牌桶限流
 * Layer 5: Tool Policy - 工具允许/拒绝列表
 * Layer 6: Elevated Policy - 危险工具授权
 * Layer 7: RBAC - 基于角色的访问控制
 * Layer 8: Audit Logging - JSONL 审计日志
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Layer 1: SSRF Protection
// ============================================================================

class SSRFProtection {
  constructor() {
    // 私有 IP 地址范围
    this.privateRanges = [
      { start: '10.0.0.0', end: '10.255.255.255', cidr: '10.0.0.0/8' },
      { start: '172.16.0.0', end: '172.31.255.255', cidr: '172.16.0.0/12' },
      { start: '192.168.0.0', end: '192.168.255.255', cidr: '192.168.0.0/16' },
      { start: '127.0.0.0', end: '127.255.255.255', cidr: '127.0.0.0/8' },
      { start: '169.254.0.0', end: '169.254.255.255', cidr: '169.254.0.0/16' },
      { start: '0.0.0.0', end: '0.255.255.255', cidr: '0.0.0.0/8' },
    ];

    // 内网域名
    this.internalDomains = [
      'localhost',
      'local',
      'localhost.localdomain',
      'ip6-localhost',
      'ip6-loopback',
    ];
  }

  /**
   * 检查 IP 地址是否为私有地址
   */
  isPrivateIP(ip) {
    // 检查 IPv4
    if (this.isIPv4(ip)) {
      const ipNum = this.ipToNumber(ip);
      return this.privateRanges.some(range => {
        return ipNum >= this.ipToNumber(range.start) &&
               ipNum <= this.ipToNumber(range.end);
      });
    }

    // 检查 IPv6 本地地址
    if (this.isIPv6(ip)) {
      return ip.startsWith('fe80::') ||  // 链路本地
             ip.startsWith('fc00::') ||  // 唯一本地
             ip.startsWith('fd00::') ||  // 唯一本地
             ip === '::1' ||             // IPv6 环回
             ip === '::';                // 全未指定
    }

    return false;
  }

  isIPv4(ip) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  }

  isIPv6(ip) {
    return ip.includes(':');
  }

  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  /**
   * 检查域名是否为内网域名
   */
  isInternalDomain(hostname) {
    const lower = hostname.toLowerCase();
    return this.internalDomains.some(domain => lower === domain || lower.endsWith('.' + domain));
  }

  /**
   * 验证 URL 是否安全（防止 SSRF）
   */
  validateURL(url) {
    try {
      const parsed = new URL(url);

      // 检查协议
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { safe: false, reason: 'Invalid protocol' };
      }

      // 检查主机名
      if (this.isInternalDomain(parsed.hostname)) {
        return { safe: false, reason: 'Internal hostname blocked' };
      }

      // DNS 解析并检查 IP
      const dns = require('dns').promises;
      return dns.lookup(parsed.hostname).then(({ address }) => {
        if (this.isPrivateIP(address)) {
          return { safe: false, reason: 'Private IP blocked' };
        }
        return { safe: true, address };
      }).catch(() => {
        return { safe: false, reason: 'DNS resolution failed' };
      });

    } catch (error) {
      return { safe: false, reason: 'Invalid URL' };
    }
  }
}

// ============================================================================
// Layer 2: Command Filters
// ============================================================================

class CommandFilter {
  constructor() {
    // 危险命令模式
    this.dangerousPatterns = [
      /rm\s+-rf?\s+\//,           // rm -rf /
      /rm\s+-rf?\s+\.\./,          // rm -rf ../
      />?\s*\/dev\/(sd[a-z]|null)/, // 覆盖磁盘设备
      /dd\s+if=.*of=\/dev\/sd/,    // dd 写入磁盘
      /mkfs\.\w+/,                 // 格式化文件系统
      /:\s*\(\s*\)\s*\{\s*\:\s*\:\s*\:\s*\}\s*;/,  // fork 炸弹 :(){:|:&};:
      /kill\s+-9\s+1/,             // kill init
      /shutdown\s+/,
      /reboot\s+/,
      /halt\s+/,
      /chmod\s+000\s+\//,          // chmod 000 /
      /chown\s+-R\s+root/,
      /wget.*\|\s*sh/,             // wget | sh
      /curl.*\|\s*bash/,           // curl | bash
      /eval\s*\$\(.*/,             // eval $()
      />\s*\/etc\//,               // 重定向到 /etc
      /mv\s+.*\/etc\//,            // 移动文件到 /etc
    ];

    // 受保护的路径
    this.protectedPaths = [
      '/bin',
      '/sbin',
      '/usr/bin',
      '/usr/sbin',
      '/etc',
      '/boot',
      '/lib',
      '/lib64',
      '/sys',
      '/proc',
      '/dev',
    ];
  }

  /**
   * 检查命令是否安全
   */
  validateCommand(command) {
    // 检查危险模式
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          safe: false,
          reason: `Dangerous command pattern detected: ${pattern}`
        };
      }
    }

    // 检查受保护路径
    for (const protectedPath of this.protectedPaths) {
      if (command.includes(protectedPath) && /rm|mv|dd|chmod|chown|write/.test(command)) {
        return {
          safe: false,
          reason: `Protected path: ${protectedPath}`
        };
      }
    }

    return { safe: true };
  }

  /**
   * 清理命令参数
   */
  sanitizeCommand(command) {
    // 移除 shell 元字符
    return command
      .replace(/[;&|`$()]/g, '')
      .trim();
  }
}

// ============================================================================
// Layer 3: Pairing Codes
// ============================================================================

class PairingCodeManager {
  constructor(stateDir = './data/pairing') {
    this.stateDir = stateDir;
    this.codeExpiry = 5 * 60 * 1000; // 5 分钟
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * 生成 6 位配对码
   */
  generate(channel, sender) {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const now = Date.now();
    const expiry = now + this.codeExpiry;

    const pairingData = {
      channel,
      sender,
      code,
      expires_at: expiry,
      created_at: now,
    };

    const key = this.sanitizeKey(`${channel}_${sender}`);
    const filepath = path.join(this.stateDir, `${key}.json`);

    fs.writeFileSync(filepath, JSON.stringify(pairingData), { mode: 0o600 });

    // 记录审计日志
    auditLog('pairing_code_generated', `channel=${channel} sender=${sender}`);

    return code;
  }

  /**
   * 验证配对码
   */
  verify(channel, sender, code) {
    const key = this.sanitizeKey(`${channel}_${sender}`);
    const filepath = path.join(this.stateDir, `${key}.json`);

    if (!fs.existsSync(filepath)) {
      auditLog('pairing_code_verify_failed', `channel=${channel} sender=${sender} reason=no_code`);
      return { valid: false, reason: 'No code found' };
    }

    const pairingData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const now = Date.now();

    // 检查过期
    if (now > pairingData.expires_at) {
      fs.unlinkSync(filepath);
      auditLog('pairing_code_verify_failed', `channel=${channel} sender=${sender} reason=expired`);
      return { valid: false, reason: 'Code expired' };
    }

    // 时间安全的比较
    if (!this.safeEqual(code, pairingData.code)) {
      auditLog('pairing_code_verify_failed', `channel=${channel} sender=${sender} reason=mismatch`);
      return { valid: false, reason: 'Code mismatch' };
    }

    // 验证成功，删除配对码（一次性使用）
    fs.unlinkSync(filepath);

    // 标记为已验证
    const verifiedDir = path.join(this.stateDir, 'verified');
    if (!fs.existsSync(verifiedDir)) {
      fs.mkdirSync(verifiedDir, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(path.join(verifiedDir, key), now.toString());

    auditLog('pairing_code_verified', `channel=${channel} sender=${sender}`);
    return { valid: true };
  }

  /**
   * 检查是否已验证
   */
  isVerified(channel, sender) {
    const key = this.sanitizeKey(`${channel}_${sender}`);
    const verifiedFile = path.join(this.stateDir, 'verified', key);
    return fs.existsSync(verifiedFile);
  }

  /**
   * 时间安全的字符串比较（防止时序攻击）
   */
  safeEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', crypto.randomBytes(32));
    const hashA = hmac.update(a).copy().digest();
    const hashB = hmac.update(b).digest();

    return crypto.timingSafeEqual(Buffer.from(hashA), Buffer.from(hashB));
  }

  sanitizeKey(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

// ============================================================================
// Layer 4: Rate Limiting (Token Bucket)
// ============================================================================

class RateLimiter {
  constructor(stateDir = './data/ratelimit') {
    this.stateDir = stateDir;
    this.defaultMaxPerMin = 30;
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * 检查是否允许请求
   */
  check(sender, maxPerMin = null) {
    maxPerMin = maxPerMin || this.defaultMaxPerMin;
    const now = Date.now();
    const windowStart = now - 60000; // 1 分钟窗口

    const safeSender = this.sanitizeKey(sender);
    const filepath = path.join(this.stateDir, `${safeSender}.dat`);

    // 读取现有时间戳
    let timestamps = [];
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8');
      timestamps = content.trim().split('\n')
        .map(Number)
        .filter(ts => ts > windowStart);
    }

    // 检查是否超过限制
    if (timestamps.length >= maxPerMin) {
      auditLog('rate_limited', `sender=${sender} count=${timestamps.length} max=${maxPerMin}`);
      return { allowed: false, count: timestamps.length, max: maxPerMin };
    }

    // 记录此次请求
    timestamps.push(now);
    fs.writeFileSync(filepath, timestamps.join('\n') + '\n');

    return { allowed: true, count: timestamps.length, max: maxPerMin };
  }

  /**
   * 重置限制
   */
  reset(sender) {
    const safeSender = this.sanitizeKey(sender);
    const filepath = path.join(this.stateDir, `${safeSender}.dat`);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  sanitizeKey(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

// ============================================================================
// Layer 5: Tool Policy
// ============================================================================

class ToolPolicy {
  constructor() {
    // 工具策略配置
    this.policies = {
      // 默认策略
      default: {
        allow: ['web_fetch', 'web_search', 'read_file', 'list_files', 'file_search'],
        deny: ['shell', 'write_file'],
        profile: 'read-only',
      },
      // 管理员策略
      admin: {
        allow: ['*'],
        deny: [],
        profile: 'full-access',
      },
      // 开发者策略
      developer: {
        allow: ['web_fetch', 'web_search', 'shell', 'read_file', 'write_file', 'list_files', 'file_search'],
        deny: [],
        profile: 'development',
      },
    };

    // 工具配置文件
    this.profiles = {
      'read-only': {
        description: '只读访问',
        tools: ['web_fetch', 'web_search', 'read_file', 'list_files', 'file_search', 'memory'],
      },
      'development': {
        description: '开发环境',
        tools: ['web_fetch', 'web_search', 'shell', 'read_file', 'write_file', 'list_files', 'file_search', 'memory', 'cron'],
      },
      'full-access': {
        description: '完全访问',
        tools: ['*'],
      },
    };
  }

  /**
   * 检查工具是否允许使用
   */
  isAllowed(agentId, toolName) {
    const policy = this.policies[agentId] || this.policies.default;

    // 检查拒绝列表
    if (policy.deny.includes(toolName) || policy.deny.includes('*')) {
      return false;
    }

    // 检查允许列表
    if (policy.allow.includes('*')) {
      return true;
    }

    return policy.allow.includes(toolName);
  }

  /**
   * 获取 agent 的工具列表
   */
  getTools(agentId) {
    const policy = this.policies[agentId] || this.policies.default;

    if (policy.allow.includes('*')) {
      // 全部工具
      return ['*'];
    }

    return policy.allow;
  }

  /**
   * 设置 agent 策略
   */
  setPolicy(agentId, policy) {
    this.policies[agentId] = policy;
  }
}

// ============================================================================
// Layer 6: Elevated Policy
// ============================================================================

class ElevatedPolicy {
  constructor() {
    // 需要提升权限的工具
    this.elevatedTools = ['shell', 'write_file', 'cron'];

    // 授权状态
    this.authorizations = new Map();
  }

  /**
   * 检查工具是否需要提升权限
   */
  isElevated(toolName) {
    return this.elevatedTools.includes(toolName);
  }

  /**
   * 请求提升权限
   */
  requestElevation(agentId, toolName, args) {
    // 检查是否已授权
    const key = `${agentId}:${toolName}`;
    if (this.authorizations.has(key)) {
      const auth = this.authorizations.get(key);
      if (Date.now() < auth.expires) {
        return { authorized: true, cached: true };
      }
    }

    // 记录需要授权
    auditLog('elevation_requested', `agent=${agentId} tool=${toolName}`);

    return {
      authorized: false,
      requiresApproval: true,
      reason: `Tool '${toolName}' requires elevated privileges`
    };
  }

  /**
   * 授予提升权限
   */
  grantElevation(agentId, toolName, duration = 300000) { // 默认 5 分钟
    const key = `${agentId}:${toolName}`;
    this.authorizations.set(key, {
      granted: Date.now(),
      expires: Date.now() + duration,
    });

    auditLog('elevation_granted', `agent=${agentId} tool=${toolName} duration=${duration}`);
  }

  /**
   * 撤销提升权限
   */
  revokeElevation(agentId, toolName) {
    const key = `${agentId}:${toolName}`;
    this.authorizations.delete(key);

    auditLog('elevation_revoked', `agent=${agentId} tool=${toolName}`);
  }
}

// ============================================================================
// Layer 7: RBAC (Role-Based Access Control)
// ============================================================================

class RBAC {
  constructor() {
    // 角色定义
    this.roles = {
      admin: {
        permissions: ['*'],
        description: '系统管理员',
      },
      developer: {
        permissions: [
          'agent:read',
          'agent:write',
          'session:read',
          'session:write',
          'config:read',
          'config:write',
          'tools:*',
        ],
        description: '开发者',
      },
      user: {
        permissions: [
          'agent:read',
          'session:read',
          'config:read',
        ],
        description: '普通用户',
      },
      guest: {
        permissions: [
          'agent:read',
        ],
        description: '访客',
      },
    };

    // 用户角色映射
    this.userRoles = new Map();
  }

  /**
   * 分配用户角色
   */
  assignRole(userId, role) {
    if (!this.roles[role]) {
      throw new Error(`Unknown role: ${role}`);
    }
    this.userRoles.set(userId, role);

    auditLog('role_assigned', `user=${userId} role=${role}`);
  }

  /**
   * 获取用户角色
   */
  getRole(userId) {
    return this.userRoles.get(userId) || 'guest';
  }

  /**
   * 检查权限
   */
  hasPermission(userId, permission) {
    const role = this.getRole(userId);
    const roleConfig = this.roles[role];

    if (roleConfig.permissions.includes('*')) {
      return true;
    }

    // 检查通配符权限
    const [resource, action] = permission.split(':');
    if (roleConfig.permissions.includes(`${resource}:*`)) {
      return true;
    }

    return roleConfig.permissions.includes(permission);
  }

  /**
   * 检查并抛出权限错误
   */
  checkPermission(userId, permission) {
    if (!this.hasPermission(userId, permission)) {
      throw new Error(`Access denied: ${permission}`);
    }
  }
}

// ============================================================================
// Layer 8: Audit Logging
// ============================================================================

const auditLogDir = './data/logs/audit';

function ensureAuditDir() {
  if (!fs.existsSync(auditLogDir)) {
    fs.mkdirSync(auditLogDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * 记录审计日志（JSONL 格式）
 */
function auditLog(event, details = '') {
  ensureAuditDir();

  const entry = {
    event,
    details,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };

  const filepath = path.join(auditLogDir, 'audit.jsonl');
  const line = JSON.stringify(entry) + '\n';

  fs.appendFileSync(filepath, line, { mode: 0o600 });
}

/**
 * 查询审计日志
 */
function queryAuditLog(filter = {}) {
  const filepath = path.join(auditLogDir, 'audit.jsonl');

  if (!fs.existsSync(filepath)) {
    return [];
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.trim().split('\n');

  return lines
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(entry => {
      if (!entry) return false;

      if (filter.event && entry.event !== filter.event) return false;
      if (filter.startTime && new Date(entry.timestamp) < new Date(filter.startTime)) return false;
      if (filter.endTime && new Date(entry.timestamp) > new Date(filter.endTime)) return false;

      return true;
    });
}

// ============================================================================
// Security Manager (统一接口)
// ============================================================================

class SecurityManager {
  constructor(config = {}) {
    this.stateDir = config.stateDir || './data/security';

    // 初始化所有层
    this.ssrf = new SSRFProtection();
    this.commandFilter = new CommandFilter();
    this.pairing = new PairingCodeManager(path.join(this.stateDir, 'pairing'));
    this.rateLimiter = new RateLimiter(path.join(this.stateDir, 'ratelimit'));
    this.toolPolicy = new ToolPolicy();
    this.elevatedPolicy = new ElevatedPolicy();
    this.rbac = new RBAC();

    auditLog('security_manager_initialized', `stateDir=${this.stateDir}`);
  }

  /**
   * 验证 Web 请求（Layer 1 SSRF + Layer 4 Rate Limiting）
   */
  async validateWebRequest(userId, url) {
    // SSRF 检查
    const ssrfResult = await this.ssrf.validateURL(url);
    if (!ssrfResult.safe) {
      auditLog('web_request_blocked', `user=${userId} url=${url} reason=${ssrfResult.reason}`);
      return { allowed: false, reason: ssrfResult.reason };
    }

    // 速率限制
    const rateLimitResult = this.rateLimiter.check(userId);
    if (!rateLimitResult.allowed) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    return { allowed: true };
  }

  /**
   * 验证命令执行（Layer 2 Command Filter + Layer 4 Rate Limiting + Layer 6 Elevated）
   */
  validateCommand(userId, command, agentId) {
    // 命令过滤
    const filterResult = this.commandFilter.validateCommand(command);
    if (!filterResult.safe) {
      auditLog('command_blocked', `user=${userId} command="${command}" reason=${filterResult.reason}`);
      return { allowed: false, reason: filterResult.reason };
    }

    // 速率限制
    const rateLimitResult = this.rateLimiter.check(userId);
    if (!rateLimitResult.allowed) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // 工具策略
    if (!this.toolPolicy.isAllowed(agentId, 'shell')) {
      return { allowed: false, reason: 'Tool policy denies shell access' };
    }

    // 提升权限检查
    const elevationResult = this.elevatedPolicy.requestElevation(agentId, 'shell', command);
    if (!elevationResult.authorized) {
      return {
        allowed: false,
        requiresApproval: true,
        reason: elevationResult.reason
      };
    }

    return { allowed: true };
  }

  /**
   * 验证通道消息（Layer 3 Pairing + Layer 4 Rate Limiting + Layer 7 RBAC）
   */
  async validateChannelMessage(channel, sender, message, agentId) {
    // 配对码检查
    if (!this.pairing.isVerified(channel, sender)) {
      auditLog('channel_message_rejected', `channel=${channel} sender=${sender} reason=not_paired`);
      return { allowed: false, reason: 'Channel not paired' };
    }

    // 速率限制
    const rateLimitResult = this.rateLimiter.check(`${channel}:${sender}`);
    if (!rateLimitResult.allowed) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    // RBAC 检查
    if (!this.rbac.hasPermission(sender, 'agent:read')) {
      return { allowed: false, reason: 'Permission denied' };
    }

    return { allowed: true };
  }

  /**
   * 生成配对码
   */
  generatePairingCode(channel, sender) {
    return this.pairing.generate(channel, sender);
  }

  /**
   * 验证配对码
   */
  verifyPairingCode(channel, sender, code) {
    return this.pairing.verify(channel, sender, code);
  }

  /**
   * 获取审计日志
   */
  getAuditLog(filter) {
    return queryAuditLog(filter);
  }

  /**
   * 获取安全状态
   */
  getStatus() {
    return {
      stateDir: this.stateDir,
      layers: [
        { name: 'SSRF Protection', status: 'active' },
        { name: 'Command Filters', status: 'active' },
        { name: 'Pairing Codes', status: 'active' },
        { name: 'Rate Limiting', status: 'active' },
        { name: 'Tool Policy', status: 'active' },
        { name: 'Elevated Policy', status: 'active' },
        { name: 'RBAC', status: 'active' },
        { name: 'Audit Logging', status: 'active' },
      ],
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  SSRFProtection,
  CommandFilter,
  PairingCodeManager,
  RateLimiter,
  ToolPolicy,
  ElevatedPolicy,
  RBAC,
  SecurityManager,
  auditLog,
  queryAuditLog,
};

// ============================================================================
// Demo
// ============================================================================

if (require.main === module) {
  async function demo() {
    console.log('🔒 LX-PCEC 安全层演示\n');

    const security = new SecurityManager();

    // 演示 SSRF 保护
    console.log('1. SSRF 保护测试:');
    console.log('   私有 IP 192.168.1.1:', await security.ssrf.isPrivateIP('192.168.1.1'));
    console.log('   公共 IP 8.8.8.8:', await security.ssrf.isPrivateIP('8.8.8.8'));

    // 演示命令过滤
    console.log('\n2. 命令过滤测试:');
    console.log('   ls -la:', security.commandFilter.validateCommand('ls -la'));
    console.log('   rm -rf /:', security.commandFilter.validateCommand('rm -rf /'));

    // 演示配对码
    console.log('\n3. 配对码测试:');
    const code = security.generatePairingCode('telegram', 'user123');
    console.log('   生成配对码:', code);
    console.log('   验证配对码:', security.verifyPairingCode('telegram', 'user123', code));

    // 演示速率限制
    console.log('\n4. 速率限制测试:');
    for (let i = 0; i < 35; i++) {
      const result = security.rateLimiter.check('test_user');
      if (!result.allowed) {
        console.log(`   第 ${i + 1} 次请求被限流`);
        break;
      }
    }

    // 演示审计日志
    console.log('\n5. 审计日志:');
    const logs = security.getAuditLog({ event: 'pairing_code_generated' });
    console.log(`   找到 ${logs.length} 条配对码生成记录`);

    console.log('\n✅ 安全层演示完成');
  }

  demo().catch(console.error);
}
