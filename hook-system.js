/**
 * LX-PCEC 钩子系统框架 (Phase 17)
 * 集成自 BashClaw 的 hooks.sh
 *
 * 来源: https://github.com/shareAI-lab/BashClaw
 * 文件: lib/hooks.sh
 *
 * 特性:
 * - 14 种事件类型
 * - 3 种策略 (modifying/void/sync)
 * - 优先级支持
 * - 异步执行
 * - 错误处理
 * - 性能监控
 */

const EventEmitter = require('events');

// ============================================================================
// 钩子定义
// ============================================================================

const HOOK_EVENTS = {
  // 消息处理
  PRE_MESSAGE: 'pre_message',              // 处理前（可修改输入）
  POST_MESSAGE: 'post_message',            // 处理后

  // 工具执行
  PRE_TOOL: 'pre_tool',                    // 工具执行前（可修改参数）
  POST_TOOL: 'post_tool',                  // 工具执行后（可修改结果）

  // 错误处理
  ON_ERROR: 'on_error',                    // 错误发生时

  // 会话管理
  ON_SESSION_RESET: 'on_session_reset',    // 会话重置时
  SESSION_START: 'session_start',          // 新会话创建

  // Agent 生命周期
  BEFORE_AGENT_START: 'before_agent_start', // Agent 开始前（同步）
  AGENT_END: 'agent_end',                  // Agent 结束后

  // 上下文管理
  BEFORE_COMPACTION: 'before_compaction',  // 上下文压缩前（同步）
  AFTER_COMPACTION: 'after_compaction',    // 上下文压缩后

  // 网关消息
  MESSAGE_RECEIVED: 'message_received',    // 消息到达网关（可修改）
  MESSAGE_SENDING: 'message_sending',      // 回复发送前（可修改）
  MESSAGE_SENT: 'message_sent',            // 回复发送后
};

// 钩子策略
const HOOK_STRATEGIES = {
  MODIFYING: 'modifying',  // 可以修改数据，返回值传递给下一个处理器
  VOID: 'void',           // 不修改数据，返回值被忽略
  SYNC: 'sync',           // 同步执行，阻塞直到完成
};

// ============================================================================
// 钩子处理器
// ============================================================================

class HookHandler {
  constructor(id, handler, options = {}) {
    this.id = id;
    this.handler = handler;
    this.priority = options.priority || 50;
    this.once = options.once || false;
    this.strategy = options.strategy || HOOK_STRATEGIES.VOID;
    this.condition = options.condition || null;
    this.metadata = options.metadata || {};

    // 性能统计
    this.callCount = 0;
    this.totalTime = 0;
    this.errorCount = 0;
    this.lastCalled = null;
  }

  /**
   * 检查是否应该执行
   */
  shouldExecute(context) {
    if (this.condition && typeof this.condition === 'function') {
      return this.condition(context);
    }
    return true;
  }

  /**
   * 执行处理器
   */
  async execute(data, context) {
    if (!this.shouldExecute(context)) {
      return data;
    }

    const startTime = Date.now();
    this.callCount++;
    this.lastCalled = new Date(startTime).toISOString();

    try {
      const result = await this.handler(data, context);

      // 更新统计
      const elapsed = Date.now() - startTime;
      this.totalTime += elapsed;

      // modifying 策略：返回结果
      if (this.strategy === HOOK_STRATEGIES.MODIFYING) {
        return result !== undefined ? result : data;
      }

      // void 或 sync 策略：忽略返回值
      return data;

    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    return {
      callCount: this.callCount,
      totalTime: this.totalTime,
      avgTime: this.callCount > 0 ? this.totalTime / this.callCount : 0,
      errorCount: this.errorCount,
      errorRate: this.callCount > 0 ? this.errorCount / this.callCount : 0,
      lastCalled: this.lastCalled,
    };
  }
}

// ============================================================================
// 钩子管理器
// ============================================================================

class HookManager extends EventEmitter {
  constructor() {
    super();
    this.hooks = new Map(); // eventName -> Array of HookHandler
    this.middlewares = [];
    this.enabled = true;
  }

  /**
   * 注册钩子
   */
  register(event, handler, options = {}) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }

    const id = options.id || `hook_${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hookHandler = new HookHandler(id, handler, options);

    const handlers = this.hooks.get(event);
    handlers.push(hookHandler);

    // 按优先级排序
    handlers.sort((a, b) => a.priority - b.priority);

    this.emit('hook_registered', { event, id, options });

    return id;
  }

  /**
   * 取消注册钩子
   */
  unregister(event, idOrHandler) {
    const handlers = this.hooks.get(event);
    if (!handlers) return false;

    let removed = 0;

    if (typeof idOrHandler === 'string') {
      // 通过 ID 删除
      const index = handlers.findIndex(h => h.id === idOrHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
        removed++;
      }
    } else if (typeof idOrHandler === 'function') {
      // 通过函数删除
      for (let i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i].handler === idOrHandler) {
          handlers.splice(i, 1);
          removed++;
        }
      }
    }

    if (handlers.length === 0) {
      this.hooks.delete(event);
    }

    return removed > 0;
  }

  /**
   * 触发钩子
   */
  async emit(event, data = {}, context = {}) {
    if (!this.enabled) return data;

    const handlers = this.hooks.get(event);
    if (!handlers || handlers.length === 0) {
      return data;
    }

    // 应用中间件
    let finalData = data;
    for (const middleware of this.middlewares) {
      finalData = await middleware(event, finalData, context);
    }

    // 执行处理器
    let result = finalData;
    const onceHandlers = [];

    for (const handler of handlers) {
      try {
        result = await handler.execute(result, context);

        // 标记一次性处理器
        if (handler.once) {
          onceHandlers.push(handler);
        }
      } catch (error) {
        // 触发错误钩子
        await this.emit(HOOK_EVENTS.ON_ERROR, {
          originalEvent: event,
          error: error.message,
          stack: error.stack,
          handlerId: handler.id,
        }, context);

        console.error(`Hook error (${event}):`, error.message);
      }
    }

    // 移除一次性处理器
    for (const handler of onceHandlers) {
      this.unregister(event, handler.id);
    }

    // 记录事件
    this.emit('hook_executed', { event, handlerCount: handlers.length });

    return result;
  }

  /**
   * 同步触发钩子（阻塞）
   */
  emitSync(event, data = {}, context = {}) {
    const handlers = this.hooks.get(event);
    if (!handlers || handlers.length === 0) {
      return data;
    }

    let result = data;
    const onceHandlers = [];

    for (const handler of handlers) {
      if (handler.strategy !== HOOK_STRATEGIES.SYNC) {
        continue;
      }

      try {
        const output = handler.handler(result, context);
        if (handler.strategy === HOOK_STRATEGIES.MODIFYING) {
          result = output !== undefined ? output : result;
        }

        if (handler.once) {
          onceHandlers.push(handler);
        }
      } catch (error) {
        console.error(`Sync hook error (${event}):`, error.message);
      }
    }

    for (const handler of onceHandlers) {
      this.unregister(event, handler.id);
    }

    return result;
  }

  /**
   * 添加中间件
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
  }

  /**
   * 移除中间件
   */
  unuse(middleware) {
    const index = this.middlewares.indexOf(middleware);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
    }
  }

  /**
   * 获取事件的所有处理器
   */
  getHandlers(event) {
    return this.hooks.get(event) || [];
  }

  /**
   * 获取所有事件
   */
  getEvents() {
    return Array.from(this.hooks.keys());
  }

  /**
   * 清空事件的所有处理器
   */
  clear(event) {
    if (event) {
      this.hooks.delete(event);
    } else {
      this.hooks.clear();
    }
  }

  /**
   * 启用/禁用钩子系统
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * 获取钩子统计信息
   */
  getStats(event = null) {
    const stats = {};

    if (event) {
      const handlers = this.hooks.get(event);
      if (handlers) {
        stats[event] = handlers.map(h => ({
          id: h.id,
          priority: h.priority,
          strategy: h.strategy,
          ...h.getStats(),
        }));
      }
    } else {
      for (const [evt, handlers] of this.hooks.entries()) {
        stats[evt] = handlers.map(h => ({
          id: h.id,
          priority: h.priority,
          strategy: h.strategy,
          ...h.getStats(),
        }));
      }
    }

    return stats;
  }

  /**
   * 获取概览
   */
  getOverview() {
    const overview = {
      totalEvents: this.hooks.size,
      totalHandlers: 0,
      enabled: this.enabled,
      events: {},
    };

    for (const [event, handlers] of this.hooks.entries()) {
      overview.totalHandlers += handlers.length;
      overview.events[event] = {
        handlerCount: handlers.length,
        strategies: {
          modifying: handlers.filter(h => h.strategy === HOOK_STRATEGIES.MODIFYING).length,
          void: handlers.filter(h => h.strategy === HOOK_STRATEGIES.VOID).length,
          sync: handlers.filter(h => h.strategy === HOOK_STRATEGIES.SYNC).length,
        },
      };
    }

    return overview;
  }
}

// ============================================================================
// 钩子上下文
// ============================================================================

class HookContext {
  constructor(data = {}) {
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.metadata = {};
  }

  set(key, value) {
    this.data[key] = value;
    return this;
  }

  get(key, defaultValue = null) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  has(key) {
    return key in this.data;
  }

  delete(key) {
    delete this.data[key];
    return this;
  }

  toJSON() {
    return {
      data: this.data,
      timestamp: this.timestamp,
      metadata: this.metadata,
    };
  }
}

// ============================================================================
// 预定义钩子助手
// ============================================================================

class HookHelpers {
  constructor(hookManager) {
    this.hooks = hookManager;
  }

  /**
   * 消息处理前钩子
   */
  onPreMessage(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.PRE_MESSAGE,
      handler,
      { ...options, strategy: HOOK_STRATEGIES.MODIFYING }
    );
  }

  /**
   * 消息处理后钩子
   */
  onPostMessage(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.POST_MESSAGE,
      handler,
      options
    );
  }

  /**
   * 工具执行前钩子
   */
  onPreTool(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.PRE_TOOL,
      handler,
      { ...options, strategy: HOOK_STRATEGIES.MODIFYING }
    );
  }

  /**
   * 工具执行后钩子
   */
  onPostTool(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.POST_TOOL,
      handler,
      { ...options, strategy: HOOK_STRATEGIES.MODIFYING }
    );
  }

  /**
   * 错误钩子
   */
  onError(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.ON_ERROR,
      handler,
      options
    );
  }

  /**
   * 会话重置钩子
   */
  onSessionReset(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.ON_SESSION_RESET,
      handler,
      options
    );
  }

  /**
   * Agent 开始前钩子
   */
  onBeforeAgentStart(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.BEFORE_AGENT_START,
      handler,
      { ...options, strategy: HOOK_STRATEGIES.SYNC }
    );
  }

  /**
   * Agent 结束后钩子
   */
  onAgentEnd(handler, options = {}) {
    return this.hooks.register(
      HOOK_EVENTS.AGENT_END,
      handler,
      options
    );
  }
}

// ============================================================================
// 钩子系统单例
// ============================================================================

const hookManager = new HookManager();
const hookHelpers = new HookHelpers(hookManager);

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  HookManager,
  HookHandler,
  HookContext,
  HookHelpers,
  HOOK_EVENTS,
  HOOK_STRATEGIES,
  hookManager,
  hookHelpers,
};

// ============================================================================
// Demo
// ============================================================================

if (require.main === module) {
  async function demo() {
    console.log('🪝 LX-PCEC 钩子系统演示\n');

    const hooks = new HookManager();
    const helpers = new HookHelpers(hooks);

    // 演示 1: 注册不同策略的钩子
    console.log('1. 注册钩子...');

    // modifying 策略（修改数据）
    helpers.onPreMessage(async (data) => {
      console.log('  → pre_message: 修改消息');
      data.message = data.message.toUpperCase();
      return data;
    }, { priority: 10 });

    // void 策略（只记录）
    helpers.onPostMessage(async (data) => {
      console.log(`  → post_message: 收到 ${data.response?.length || 0} 字符响应`);
    }, { priority: 50 });

    // sync 策略（同步执行）
    hooks.register(HOOK_EVENTS.BEFORE_AGENT_START, (data) => {
      console.log(`  → before_agent_start: Agent ${data.agentId} 准备启动`);
    }, { strategy: HOOK_STRATEGIES.SYNC, priority: 100 });

    // 演示 2: 触发钩子
    console.log('\n2. 触发 pre_message 钩子:');
    let messageData = { message: 'hello world', agentId: 'test' };
    messageData = await hooks.emit(HOOK_EVENTS.PRE_MESSAGE, messageData);
    console.log(`  结果: "${messageData.message}"`);

    // 演示 3: 触发 post_message 钩子
    console.log('\n3. 触发 post_message 钩子:');
    await hooks.emit(HOOK_EVENTS.POST_MESSAGE, {
      message: messageData.message,
      response: 'This is a response'
    });

    // 演示 4: 触发同步钩子
    console.log('\n4. 触发 before_agent_start 同步钩子:');
    hooks.emitSync(HOOK_EVENTS.BEFORE_AGENT_START, { agentId: 'test' });

    // 演示 5: 错误处理
    console.log('\n5. 错误处理:');
    helpers.onError(async (data) => {
      console.log(`  → on_error: ${data.error} (事件: ${data.originalEvent})`);
    });

    await hooks.emit(HOOK_EVENTS.PRE_MESSAGE, {}, { triggerError: true });

    // 演示 6: 一次性钩子
    console.log('\n6. 一次性钩子:');
    hooks.register(HOOK_EVENTS.POST_MESSAGE, async () => {
      console.log('  → 这个钩子只会执行一次');
    }, { once: true });

    await hooks.emit(HOOK_EVENTS.POST_MESSAGE, {});
    await hooks.emit(HOOK_EVENTS.POST_MESSAGE, {}); // 第二次不会执行

    // 演示 7: 条件钩子
    console.log('\n7. 条件钩子:');
    hooks.register(HOOK_EVENTS.PRE_MESSAGE, async (data) => {
      console.log('  → 只在 agentId=admin 时执行');
      return data;
    }, {
      condition: (context) => context.agentId === 'admin'
    });

    await hooks.emit(HOOK_EVENTS.PRE_MESSAGE, {}, { agentId: 'user' }); // 不执行
    await hooks.emit(HOOK_EVENTS.PRE_MESSAGE, {}, { agentId: 'admin' }); // 执行

    // 演示 8: 中间件
    console.log('\n8. 中间件:');
    hooks.use(async (event, data, context) => {
      console.log(`  → 中间件: 拦截 ${event} 事件`);
      return data;
    });

    await hooks.emit(HOOK_EVENTS.POST_MESSAGE, {});

    // 演示 9: 获取统计信息
    console.log('\n9. 钩子统计信息:');
    const overview = hooks.getOverview();
    console.log(`  总事件数: ${overview.totalEvents}`);
    console.log(`  总处理器数: ${overview.totalHandlers}`);
    console.log('  事件详情:');
    for (const [event, info] of Object.entries(overview.events)) {
      console.log(`    ${event}: ${info.handlerCount} 个处理器`);
    }

    // 演示 10: 性能统计
    console.log('\n10. 性能统计:');
    const stats = hooks.getStats(HOOK_EVENTS.PRE_MESSAGE);
    for (const handler of stats[HOOK_EVENTS.PRE_MESSAGE]) {
      console.log(`  处理器 ${handler.id}:`);
      console.log(`    调用次数: ${handler.callCount}`);
      console.log(`    平均时间: ${handler.avgTime.toFixed(2)}ms`);
      console.log(`    错误率: ${(handler.errorRate * 100).toFixed(2)}%`);
    }

    console.log('\n✅ 钩子系统演示完成');
  }

  demo().catch(console.error);
}
