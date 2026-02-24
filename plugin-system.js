/**
 * LX-PCEC 插件系统架构 (Phase 17)
 * 集成自 BashClaw 的 plugin.sh
 *
 * 来源: https://github.com/shareAI-lab/BashClaw
 * 文件: lib/plugin.sh
 *
 * 特性:
 * - 4 路径插件发现
 * - 工具注册
 * - 钩子注册
 * - 命令注册
 * - 提供商注册
 * - 依赖管理
 * - 生命周期管理
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 插件元数据
// ============================================================================

class PluginMetadata {
  constructor(manifestPath) {
    this.manifestPath = manifestPath;
    this.manifest = this.loadManifest();
  }

  loadManifest() {
    try {
      const content = fs.readFileSync(this.manifestPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load plugin manifest: ${error.message}`);
    }
  }

  get id() {
    return this.manifest.id || path.basename(path.dirname(this.manifestPath));
  }

  get name() {
    return this.manifest.name || this.id;
  }

  get version() {
    return this.manifest.version || '0.0.0';
  }

  get description() {
    return this.manifest.description || '';
  }

  get author() {
    return this.manifest.author || '';
  }

  get dependencies() {
    return this.manifest.dependencies || {};
  }

  get main() {
    return this.manifest.main || 'index.js';
  }

  get enabled() {
    return this.manifest.enabled !== false;
  }
}

// ============================================================================
// 插件加载器
// ============================================================================

class PluginLoader {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map(); // hookName -> Set of handlers
    this.tools = new Map();  // toolName -> pluginId
    this.commands = new Map(); // commandName -> pluginId
    this.providers = new Map(); // providerId -> pluginId
  }

  /**
   * 从 4 路径发现插件
   * 1. ${PROJECT_ROOT}/plugins/ - 项目插件
   * 2. ${HOME}/.lx-pcec/plugins/ - 用户插件
   * 3. ${WORKSPACE}/.plugins/ - 工作区插件
   * 4. 自定义路径
   */
  discoverPaths() {
    const paths = [
      path.join(process.cwd(), 'plugins'),
      path.join(process.env.HOME || process.env.USERPROFILE || '', '.lx-pcec', 'plugins'),
      path.join(process.cwd(), '.plugins'),
    ];

    // 从环境变量读取自定义路径
    const customPaths = process.env.LX_PCEC_PLUGIN_PATHS;
    if (customPaths) {
      paths.push(...customPaths.split(path.delimiter));
    }

    return paths.filter(p => fs.existsSync(p));
  }

  /**
   * 发现所有插件
   */
  discover() {
    const discovered = [];
    const searchPaths = this.discoverPaths();

    for (const searchPath of searchPaths) {
      const entries = fs.readdirSync(searchPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginDir = path.join(searchPath, entry.name);
        const manifestPath = path.join(pluginDir, 'plugin.json');

        if (fs.existsSync(manifestPath)) {
          try {
            const metadata = new PluginMetadata(manifestPath);
            discovered.push(metadata);
          } catch (error) {
            console.warn(`Failed to load plugin manifest: ${manifestPath}`, error.message);
          }
        }
      }
    }

    return discovered;
  }

  /**
   * 加载插件
   */
  async load(pluginMetadata) {
    const { id } = pluginMetadata;

    // 检查依赖
    const missingDeps = this.checkDependencies(pluginMetadata);
    if (missingDeps.length > 0) {
      throw new Error(`Missing dependencies for ${id}: ${missingDeps.join(', ')}`);
    }

    // 加载插件代码
    const pluginDir = path.dirname(pluginMetadata.manifestPath);
    const mainPath = path.join(pluginDir, pluginMetadata.main);

    if (!fs.existsSync(mainPath)) {
      throw new Error(`Plugin main file not found: ${mainPath}`);
    }

    // 清除 require 缓存（支持热重载）
    delete require.cache[require.resolve(mainPath)];

    const pluginModule = require(mainPath);
    const context = this.createPluginContext(pluginMetadata);

    // 初始化插件
    let instance;
    if (typeof pluginModule === 'function') {
      // 插件是构造函数
      instance = new pluginModule(context);
    } else if (pluginModule.default && typeof pluginModule.default === 'function') {
      // ES6 默认导出
      instance = new pluginModule.default(context);
    } else if (pluginModule.activate && typeof pluginModule.activate === 'function') {
      // 简单对象
      instance = pluginModule;
      await instance.activate(context);
    } else {
      // 原始模块
      instance = pluginModule;
    }

    this.plugins.set(id, {
      metadata: pluginMetadata,
      instance,
      context,
      loadedAt: Date.now(),
    });

    console.log(`[Plugin] Loaded: ${pluginMetadata.name} v${pluginMetadata.version}`);
    return instance;
  }

  /**
   * 创建插件上下文
   */
  createPluginContext(metadata) {
    return {
      // 插件信息
      metadata,

      // 注册 API
      registerTool: (name, spec, handler) => this.registerTool(metadata.id, name, spec, handler),
      registerHook: (event, handler, priority) => this.registerHook(metadata.id, event, handler, priority),
      registerCommand: (name, spec, handler) => this.registerCommand(metadata.id, name, spec, handler),
      registerProvider: (id, spec) => this.registerProvider(metadata.id, id, spec),

      // 注销 API
      unregisterTool: (name) => this.unregisterTool(name),
      unregisterHook: (event, handler) => this.unregisterHook(event, handler),
      unregisterCommand: (name) => this.unregisterCommand(name),
      unregisterProvider: (id) => this.unregisterProvider(id),

      // 日志
      log: {
        info: (msg) => console.log(`[${metadata.name}] ${msg}`),
        warn: (msg) => console.warn(`[${metadata.name}] ${msg}`),
        error: (msg) => console.error(`[${metadata.name}] ${msg}`),
        debug: (msg) => process.env.DEBUG && console.log(`[${metadata.name}] ${msg}`),
      },

      // 状态
      getState: () => this.getPluginState(metadata.id),
      setState: (state) => this.setPluginState(metadata.id, state),
    };
  }

  /**
   * 检查依赖
   */
  checkDependencies(metadata) {
    const missing = [];
    const deps = metadata.dependencies;

    for (const [depId, requiredVersion] of Object.entries(deps)) {
      const depPlugin = this.plugins.get(depId);

      if (!depPlugin) {
        missing.push(depId);
        continue;
      }

      // 简单版本检查（可以升级为 semver）
      if (requiredVersion && !this.satisfiesVersion(depPlugin.metadata.version, requiredVersion)) {
        missing.push(`${depId}@${requiredVersion}`);
      }
    }

    return missing;
  }

  satisfiesVersion(actual, required) {
    // 简化版本检查，实际应该使用 semver
    return actual === required || required === '*';
  }

  /**
   * 卸载插件
   */
  async unload(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // 调用 deactivate
    if (plugin.instance && typeof plugin.instance.deactivate === 'function') {
      await plugin.instance.deactivate();
    }

    // 清理注册
    this.cleanupPluginRegistrations(pluginId);

    // 删除插件
    this.plugins.delete(pluginId);

    console.log(`[Plugin] Unloaded: ${plugin.metadata.name}`);
  }

  /**
   * 清理插件注册
   */
  cleanupPluginRegistrations(pluginId) {
    // 清理工具
    for (const [toolName, pid] of this.tools.entries()) {
      if (pid === pluginId) {
        this.tools.delete(toolName);
      }
    }

    // 清理命令
    for (const [cmdName, pid] of this.commands.entries()) {
      if (pid === pluginId) {
        this.commands.delete(cmdName);
      }
    }

    // 清理提供商
    for (const [provId, pid] of this.providers.entries()) {
      if (pid === pluginId) {
        this.providers.delete(provId);
      }
    }

    // 清理钩子
    for (const [eventName, handlers] of this.hooks.entries()) {
      for (const handler of handlers) {
        if (handler.pluginId === pluginId) {
          handlers.delete(handler);
        }
      }
      if (handlers.size === 0) {
        this.hooks.delete(eventName);
      }
    }
  }

  // ========================================================================
  // 工具注册
  // ========================================================================

  registerTool(pluginId, name, spec, handler) {
    if (this.tools.has(name)) {
      throw new Error(`Tool already registered: ${name}`);
    }

    this.tools.set(name, {
      pluginId,
      spec,
      handler,
    });
  }

  unregisterTool(name) {
    this.tools.delete(name);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  listTools() {
    return Array.from(this.tools.entries()).map(([name, tool]) => ({
      name,
      pluginId: tool.pluginId,
      spec: tool.spec,
    }));
  }

  // ========================================================================
  // 钩子注册
  // ========================================================================

  registerHook(pluginId, event, handler, priority = 50) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, new Set());
    }

    const handlers = this.hooks.get(event);
    handlers.add({
      pluginId,
      handler,
      priority,
      id: `${pluginId}_${event}_${Date.now()}`,
    });
  }

  unregisterHook(event, handler) {
    const handlers = this.hooks.get(event);
    if (!handlers) return;

    for (const h of handlers) {
      if (h.handler === handler) {
        handlers.delete(h);
        break;
      }
    }
  }

  /**
   * 触发钩子
   * 返回修改后的数据（如果策略是 modifying）
   */
  async emitHook(event, data, strategy = 'void') {
    const handlers = this.hooks.get(event);
    if (!handlers) return data;

    // 按优先级排序
    const sorted = Array.from(handlers).sort((a, b) => a.priority - b.priority);

    let result = data;

    for (const { handler } of sorted) {
      try {
        const output = await handler(result);

        // modifying 策略：使用返回值
        if (strategy === 'modifying' && output !== undefined) {
          result = output;
        }
      } catch (error) {
        console.error(`Hook error (${event}):`, error.message);
      }
    }

    return result;
  }

  listHooks(event) {
    if (event) {
      const handlers = this.hooks.get(event);
      return handlers ? Array.from(handlers) : [];
    }

    const all = {};
    for (const [eventName, handlers] of this.hooks.entries()) {
      all[eventName] = Array.from(handlers).map(h => ({
        pluginId: h.pluginId,
        priority: h.priority,
      }));
    }
    return all;
  }

  // ========================================================================
  // 命令注册
  // ========================================================================

  registerCommand(pluginId, name, spec, handler) {
    if (this.commands.has(name)) {
      throw new Error(`Command already registered: ${name}`);
    }

    this.commands.set(name, {
      pluginId,
      spec,
      handler,
    });
  }

  unregisterCommand(name) {
    this.commands.delete(name);
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  listCommands() {
    return Array.from(this.commands.entries()).map(([name, cmd]) => ({
      name,
      pluginId: cmd.pluginId,
      spec: cmd.spec,
    }));
  }

  /**
   * 执行命令
   */
  async executeCommand(name, args) {
    const cmd = this.commands.get(name);
    if (!cmd) {
      throw new Error(`Command not found: ${name}`);
    }

    return await cmd.handler(args);
  }

  // ========================================================================
  // 提供商注册
  // ========================================================================

  registerProvider(pluginId, id, spec) {
    if (this.providers.has(id)) {
      throw new Error(`Provider already registered: ${id}`);
    }

    this.providers.set(id, {
      pluginId,
      spec,
    });
  }

  unregisterProvider(id) {
    this.providers.delete(id);
  }

  getProvider(id) {
    return this.providers.get(id);
  }

  listProviders() {
    return Array.from(this.providers.entries()).map(([id, prov]) => ({
      id,
      pluginId: prov.pluginId,
      spec: prov.spec,
    }));
  }

  // ========================================================================
  // 插件状态
  // ========================================================================

  getPluginState(pluginId) {
    const plugin = this.plugins.get(pluginId);
    return plugin?.state || {};
  }

  setPluginState(pluginId, state) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.state = { ...plugin.state, ...state };
    }
  }

  // ========================================================================
  // 批量操作
  // ========================================================================

  /**
   * 加载所有插件
   */
  async loadAll() {
    const discovered = this.discover();

    // 按依赖顺序排序（拓扑排序）
    const sorted = this.topologicalSort(discovered);

    const loaded = [];
    for (const metadata of sorted) {
      if (metadata.enabled) {
        try {
          await this.load(metadata);
          loaded.push(metadata.id);
        } catch (error) {
          console.error(`Failed to load plugin ${metadata.id}:`, error.message);
        }
      }
    }

    return loaded;
  }

  /**
   * 拓扑排序（处理依赖）
   */
  topologicalSort(plugins) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (plugin) => {
      if (visited.has(plugin.id)) return;
      if (visiting.has(plugin.id)) {
        throw new Error(`Circular dependency detected: ${plugin.id}`);
      }

      visiting.add(plugin.id);

      // 先访问依赖
      for (const depId of Object.keys(plugin.dependencies)) {
        const dep = plugins.find(p => p.id === depId);
        if (dep) {
          visit(dep);
        }
      }

      visiting.delete(plugin.id);
      visited.add(plugin.id);
      sorted.push(plugin);
    };

    for (const plugin of plugins) {
      visit(plugin);
    }

    return sorted;
  }

  /**
   * 卸载所有插件
   */
  async unloadAll() {
    const pluginIds = Array.from(this.plugins.keys());
    for (const id of pluginIds) {
      await this.unload(id);
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      totalPlugins: this.plugins.size,
      tools: this.tools.size,
      hooks: this.hooks.size,
      commands: this.commands.size,
      providers: this.providers.size,
      plugins: Array.from(this.plugins.values()).map(p => ({
        id: p.metadata.id,
        name: p.metadata.name,
        version: p.metadata.version,
        enabled: p.metadata.enabled,
        loadedAt: p.loadedAt,
      })),
    };
  }
}

// ============================================================================
// 插件系统单例
// ============================================================================

const pluginLoader = new PluginLoader();

// ============================================================================
// 插件开发辅助
// ============================================================================

/**
 * 创建插件定义（用于简单插件）
 */
function createPlugin(manifest, activate) {
  return {
    manifest,
    activate,
  };
}

/**
 * 插件装饰器（用于类插件）
 */
function Plugin(manifest) {
  return function (target) {
    target.manifest = manifest;
    return target;
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  PluginLoader,
  PluginMetadata,
  pluginLoader,
  createPlugin,
  Plugin,
};

// ============================================================================
// Demo
// ============================================================================

if (require.main === module) {
  async function demo() {
    console.log('🔌 LX-PCEC 插件系统演示\n');

    const loader = new PluginLoader();

    // 演示 1: 创建临时插件
    console.log('1. 创建临时插件目录...');

    const tempPluginDir = path.join(process.cwd(), 'plugins', 'demo-plugin');
    fs.mkdirSync(tempPluginDir, { recursive: true });

    // 插件清单
    const manifest = {
      id: 'demo-plugin',
      name: 'Demo Plugin',
      version: '1.0.0',
      description: 'A demonstration plugin',
      author: 'LX-PCEC',
      main: 'index.js',
      enabled: true,
    };

    fs.writeFileSync(
      path.join(tempPluginDir, 'plugin.json'),
      JSON.stringify(manifest, null, 2)
    );

    // 插件代码
    const pluginCode = `
class DemoPlugin {
  constructor(context) {
    this.context = context;
  }

  async activate(context) {
    context.log.info('Demo plugin activated!');

    // 注册工具
    context.registerTool('demo_tool', {
      description: 'A demo tool',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }, async (args) => {
      return { result: 'Demo tool executed: ' + args.message };
    });

    // 注册钩子
    context.registerHook('pre_message', async (data) => {
      context.log.info('pre_message hook triggered');
      return data;
    }, 50);

    // 注册命令
    context.registerCommand('demo', {
      description: 'Demo command'
    }, async (args) => {
      return 'Demo command result';
    });
  }

  async deactivate() {
    this.context.log.info('Demo plugin deactivated!');
  }
}

module.exports = DemoPlugin;
`;

    fs.writeFileSync(path.join(tempPluginDir, 'index.js'), pluginCode);

    // 演示 2: 发现和加载插件
    console.log('\n2. 发现插件...');
    const discovered = loader.discover();
    console.log(`   发现 ${discovered.length} 个插件:`);
    discovered.forEach(p => {
      console.log(`   - ${p.name} v${p.version}`);
    });

    console.log('\n3. 加载插件...');
    await loader.loadAll();

    // 演示 3: 查看注册的工具
    console.log('\n4. 已注册的工具:');
    const tools = loader.listTools();
    tools.forEach(t => {
      console.log(`   - ${t.name} (from ${t.pluginId})`);
    });

    // 演示 4: 查看注册的钩子
    console.log('\n5. 已注册的钩子:');
    const hooks = loader.listHooks();
    for (const [event, handlers] of Object.entries(hooks)) {
      console.log(`   - ${event}: ${handlers.length} 个处理器`);
    }

    // 演示 5: 查看注册的命令
    console.log('\n6. 已注册的命令:');
    const commands = loader.listCommands();
    commands.forEach(c => {
      console.log(`   - ${c.name} (from ${c.pluginId})`);
    });

    // 演示 6: 触发钩子
    console.log('\n7. 触发钩子...');
    await loader.emitHook('pre_message', { message: 'Hello' }, 'modifying');

    // 演示 7: 执行工具
    console.log('\n8. 执行工具...');
    const tool = loader.getTool('demo_tool');
    if (tool) {
      const result = await tool.handler({ message: 'Test' });
      console.log(`   结果: ${result.result}`);
    }

    // 演示 8: 执行命令
    console.log('\n9. 执行命令...');
    const cmd = loader.getCommand('demo');
    if (cmd) {
      const result = await cmd.handler({});
      console.log(`   结果: ${result}`);
    }

    // 演示 9: 获取状态
    console.log('\n10. 插件系统状态:');
    const status = loader.getStatus();
    console.log(`   总插件数: ${status.totalPlugins}`);
    console.log(`   工具数: ${status.tools}`);
    console.log(`   钩子事件数: ${status.hooks}`);
    console.log(`   命令数: ${status.commands}`);

    // 清理
    console.log('\n清理临时文件...');
    const fsExtra = require('fs-extra');
    fsExtra.removeSync(path.join(process.cwd(), 'plugins'));

    console.log('\n✅ 插件系统演示完成');
  }

  demo().catch(console.error);
}
