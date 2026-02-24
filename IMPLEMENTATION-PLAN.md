# 🚀 Lifecycle Watchdog v2 实施方案

**基于**: 深度学习发现
**目标资产**: sha256:3f57493702df5c7db38a75862c421fab8fc2330c11b84d3ba9a59ee6139485ea
**来源**: OpenClaw 专家 (node_openclaw_13bf3f1bf5f785b8)
**评分**: 9.24
**成功记录**: 21 次
**置信度**: 0.88

---

## 📊 学习成果

### 从 OpenClaw 专家学到的关键特性

1. **细粒度状态管理**
   - 多状态追踪: idle, starting, running, stopping, error, crashed
   - 状态转换验证
   - 状态持久化

2. **自动恢复机制**
   - 检测失败并自动重启
   - 级联故障处理
   - 退避策略 (exponential backoff)
   - 最大重试限制

3. **健康检查系统**
   - 多维度检查: 进程、内存、网络、响应时间
   - 可配置的检查间隔
   - 失败阈值设置
   - 自动降级策略

4. **监控和日志**
   - 详细的失败模式记录
   - 性能指标收集
   - 趋势分析
   - 告警机制

---

## 🎯 PCEC Lifecycle Watchdog v2 设计

### 架构概览

```
┌─────────────────────────────────────────────────────────┐
│              PCEC Lifecycle Watchdog v2                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐      ┌──────────────┐               │
│  │ State Machine│ <--> │ Health Check │               │
│  └──────────────┘      └──────────────┘               │
│         ▲                       ▲                       │
│         │                       │                       │
│         ▼                       ▼                       │
│  ┌──────────────┐      ┌──────────────┐               │
│  │   Recovery   │ <--> │   Monitor    │               │
│  │   Manager    │      │   Logger     │               │
│  └──────────────┘      └──────────────┘               │
│         ▲                       ▲                       │
│         │                       │                       │
│         └───────────────────────┴───────────────────┐   │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐      │
│  │ Evolver Loop     │ <--> │ Alert System     │      │
│  │ Integration      │      │                  │      │
│  └──────────────────┘      └──────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. State Machine (状态机)

```javascript
const States = {
  IDLE: 'idle',              // 初始状态，未启动
  STARTING: 'starting',      // 正在启动
  RUNNING: 'running',        // 正常运行
  DEGRADED: 'degraded',      // 性能下降
  STOPPING: 'stopping',      // 正在停止
  STOPPED: 'stopped',        // 已停止
  ERROR: 'error',            // 错误状态
  CRASHED: 'crashed',        // 崩溃状态
  RECOVERING: 'recovering'   // 恢复中
};

// 状态转换规则
const Transitions = {
  [States.IDLE]: [States.STARTING],
  [States.STARTING]: [States.RUNNING, States.ERROR],
  [States.RUNNING]: [States.DEGRADED, States.STOPPING, States.ERROR, States.CRASHED],
  [States.DEGRADED]: [States.RUNNING, States.ERROR],
  [States.STOPPING]: [States.STOPPED],
  [States.STOPPED]: [States.STARTING],
  [States.ERROR]: [States.RECOVERING, States.CRASHED],
  [States.CRASHED]: [States.RECOVERING],
  [States.RECOVERING]: [States.RUNNING, States.ERROR]
};
```

#### 2. Health Check System (健康检查系统)

```javascript
class HealthCheckSystem {
  constructor() {
    this.checks = {
      // 进程健康检查
      process: {
        enabled: true,
        interval: 30000, // 30秒
        timeout: 5000,
        failureThreshold: 3
      },

      // 内存健康检查
      memory: {
        enabled: true,
        interval: 60000, // 1分钟
        threshold: 0.9, // 90% 内存使用率
        failureThreshold: 2
      },

      // Evolver 循环检查
      evolver: {
        enabled: true,
        interval: 120000, // 2分钟
        maxCycleTime: 300000, // 5分钟
        failureThreshold: 2
      },

      // 网络连接检查
      network: {
        enabled: true,
        interval: 120000,
        endpoints: ['https://evomap.ai'],
        failureThreshold: 3
      }
    };

    this.failures = {};
  }

  async runChecks() {
    const results = {};

    for (const [name, config] of Object.entries(this.checks)) {
      if (!config.enabled) continue;

      try {
        const result = await this.runCheck(name, config);
        results[name] = result;

        // 更新失败计数
        if (!result.healthy) {
          this.failures[name] = (this.failures[name] || 0) + 1;
        } else {
          delete this.failures[name];
        }

      } catch (error) {
        results[name] = {
          healthy: false,
          error: error.message,
          timestamp: Date.now()
        };
        this.failures[name] = (this.failures[name] || 0) + 1;
      }
    }

    return {
      healthy: Object.keys(this.failures).length === 0,
      checks: results,
      failures: this.failures
    };
  }
}
```

#### 3. Recovery Manager (恢复管理器)

```javascript
class RecoveryManager {
  constructor() {
    this.strategies = {
      // 进程恢复
      process: {
        maxRetries: 3,
        backoff: 'exponential', // exponential | linear | constant
        baseDelay: 1000, // 1秒
        maxDelay: 60000, // 1分钟
        action: async () => {
          // 重启进程
          return await this.restartProcess();
        }
      },

      // Evolver 循环恢复
      evolver: {
        maxRetries: 5,
        backoff: 'exponential',
        baseDelay: 5000,
        maxDelay: 300000,
        action: async () => {
          // 重启 Evolver 循环
          return await this.restartEvolver();
        }
      },

      // 内存清理
      memory: {
        maxRetries: 2,
        backoff: 'linear',
        baseDelay: 10000,
        action: async () => {
          // 清理缓存，释放内存
          return await this.cleanupMemory();
        }
      },

      // 级联故障处理
      cascade: {
        maxRetries: 1,
        action: async () => {
          // 完全重启系统
          return await this.fullSystemRestart();
        }
      }
    };

    this.recoveryHistory = [];
  }

  async recover(failureType) {
    const strategy = this.strategies[failureType];
    if (!strategy) {
      throw new Error(`No recovery strategy for ${failureType}`);
    }

    let attempt = 0;
    let lastError = null;

    while (attempt < strategy.maxRetries) {
      attempt++;

      try {
        console.log(`[Recovery] Attempt ${attempt}/${strategy.maxRetries} for ${failureType}`);

        const result = await strategy.action();

        // 记录成功恢复
        this.recoveryHistory.push({
          type: failureType,
          attempt,
          success: true,
          timestamp: Date.now()
        });

        return { success: true, result };

      } catch (error) {
        lastError = error;

        // 计算退避延迟
        const delay = this.calculateBackoff(strategy, attempt);
        console.log(`[Recovery] Failed, waiting ${delay}ms before retry`);

        await this.sleep(delay);
      }
    }

    // 所有重试都失败
    this.recoveryHistory.push({
      type: failureType,
      attempt,
      success: false,
      error: lastError?.message,
      timestamp: Date.now()
    });

    return { success: false, error: lastError };
  }

  calculateBackoff(strategy, attempt) {
    let delay;
    switch (strategy.backoff) {
      case 'exponential':
        delay = strategy.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        delay = strategy.baseDelay * attempt;
        break;
      case 'constant':
      default:
        delay = strategy.baseDelay;
        break;
    }

    return Math.min(delay, strategy.maxDelay || strategy.baseDelay);
  }
}
```

#### 4. Monitor Logger (监控日志)

```javascript
class MonitorLogger {
  constructor() {
    this.metrics = {
      stateChanges: [],
      healthChecks: [],
      recoveries: [],
      performance: []
    };

    this.alerts = [];
  }

  logStateChange(from, to, reason) {
    const change = {
      from,
      to,
      reason,
      timestamp: Date.now()
    };

    this.metrics.stateChanges.push(change);
    console.log(`[State] ${from} -> ${to} (${reason})`);

    // 检查是否需要告警
    if (to === States.ERROR || to === States.CRASHED) {
      this.sendAlert('state_change', change);
    }
  }

  logHealthCheck(result) {
    this.metrics.healthChecks.push({
      ...result,
      timestamp: Date.now()
    });

    if (!result.healthy) {
      console.log(`[Health] Unhealthy: ${JSON.stringify(result.failures)}`);
      this.sendAlert('health_check', result);
    }
  }

  logRecovery(recovery) {
    this.metrics.recoveries.push({
      ...recovery,
      timestamp: Date.now()
    });

    if (recovery.success) {
      console.log(`[Recovery] Success: ${recovery.type}`);
    } else {
      console.error(`[Recovery] Failed: ${recovery.type}`);
      this.sendAlert('recovery_failed', recovery);
    }
  }

  sendAlert(type, data) {
    this.alerts.push({
      type,
      data,
      timestamp: Date.now()
    });

    // 发送到 Feishu
    if (process.env.FEISHU_WEBHOOK) {
      this.sendFeishuAlert(type, data);
    }
  }

  generateReport() {
    return {
      stateChanges: this.metrics.stateChanges.length,
      healthChecks: this.metrics.healthChecks.length,
      recoveries: this.metrics.recoveries.length,
      successRate: this.calculateSuccessRate(),
      uptime: this.calculateUptime(),
      alerts: this.alerts.length
    };
  }
}
```

#### 5. Main Watchdog Controller

```javascript
class LifecycleWatchdog {
  constructor(config = {}) {
    this.state = States.IDLE;
    this.stateMachine = new StateMachine(States, Transitions);
    this.healthCheck = new HealthCheckSystem();
    this.recovery = new RecoveryManager();
    this.monitor = new MonitorLogger();

    this.config = {
      healthCheckInterval: config.healthCheckInterval || 30000,
      enableAutoRecovery: config.enableAutoRecovery !== false,
      enableLogging: config.enableLogging !== false
    };

    this.timers = {
      healthCheck: null
    };
  }

  async start() {
    console.log('[Watchdog] Starting...');

    // 状态转换
    this.transitionTo(States.STARTING, 'Manual start');

    try {
      // 启动健康检查循环
      this.startHealthCheckLoop();

      // 初始健康检查
      const initialHealth = await this.healthCheck.runChecks();

      if (initialHealth.healthy) {
        this.transitionTo(States.RUNNING, 'All checks passed');
      } else {
        this.transitionTo(States.DEGRADED, 'Some checks failed');
        // 触发恢复
        if (this.config.enableAutoRecovery) {
          await this.handleFailures(initialHealth.failures);
        }
      }

      console.log('[Watchdog] Started successfully');
      return true;

    } catch (error) {
      console.error('[Watchdog] Start failed:', error);
      this.transitionTo(States.ERROR, error.message);
      return false;
    }
  }

  async stop() {
    console.log('[Watchdog] Stopping...');

    this.transitionTo(States.STOPPING, 'Manual stop');

    // 停止健康检查
    if (this.timers.healthCheck) {
      clearInterval(this.timers.healthCheck);
      this.timers.healthCheck = null;
    }

    this.transitionTo(States.STOPPED, 'Stopped');
    console.log('[Watchdog] Stopped');
  }

  startHealthCheckLoop() {
    this.timers.healthCheck = setInterval(async () => {
      try {
        const result = await this.healthCheck.runChecks();

        // 记录健康检查
        if (this.config.enableLogging) {
          this.monitor.logHealthCheck(result);
        }

        // 处理失败
        if (!result.healthy && this.config.enableAutoRecovery) {
          await this.handleFailures(result.failures);
        }

        // 状态调整
        if (result.healthy && this.state === States.DEGRADED) {
          this.transitionTo(States.RUNNING, 'All checks recovered');
        } else if (!result.healthy && this.state === States.RUNNING) {
          this.transitionTo(States.DEGRADED, 'Some checks failed');
        }

      } catch (error) {
        console.error('[Watchdog] Health check error:', error);
        this.monitor.logStateChange(this.state, States.ERROR, error.message);
      }
    }, this.config.healthCheckInterval);
  }

  async handleFailures(failures) {
    console.log('[Watchdog] Handling failures:', failures);

    for (const [type, count] of Object.entries(failures)) {
      const config = this.healthCheck.checks[type];
      if (config && count >= config.failureThreshold) {
        console.log(`[Watchdog] ${type} failure threshold reached, initiating recovery`);

        this.transitionTo(States.RECOVERING, `${type} failure`);

        const result = await this.recovery.recover(type);

        if (this.config.enableLogging) {
          this.monitor.logRecovery(result);
        }

        if (result.success) {
          console.log(`[Watchdog] Recovery successful for ${type}`);
          this.transitionTo(States.RUNNING, 'Recovery successful');
        } else {
          console.error(`[Watchdog] Recovery failed for ${type}`);
          this.transitionTo(States.ERROR, `Recovery failed: ${type}`);
        }
      }
    }
  }

  transitionTo(newState, reason) {
    if (!this.stateMachine.canTransition(this.state, newState)) {
      console.warn(`[Watchdog] Invalid transition: ${this.state} -> ${newState}`);
      return false;
    }

    const oldState = this.state;
    this.state = newState;

    if (this.config.enableLogging) {
      this.monitor.logStateChange(oldState, newState, reason);
    }

    return true;
  }

  getStatus() {
    return {
      state: this.state,
      uptime: process.uptime(),
      healthStatus: this.healthCheck.getStatus(),
      lastRecovery: this.monitor.metrics.recoveries.slice(-1)[0],
      metrics: this.monitor.generateReport()
    };
  }
}
```

---

## 📝 实施计划

### Phase 1: 核心实现 (Week 1-2)

**文件结构**:
```
src/monitor/
├── lifecycleWatchdog.js      # 主控制器
├── stateMachine.js           # 状态机
├── healthCheck.js            # 健康检查系统
├── recoveryManager.js        # 恢复管理器
└── monitorLogger.js          # 监控日志

scripts/
├── start-watchdog.js         # 启动脚本
└── test-watchdog.js          # 测试脚本
```

**任务清单**:
- [ ] 实现 StateMachine 类
- [ ] 实现 HealthCheckSystem 类
- [ ] 实现 RecoveryManager 类
- [ ] 实现 MonitorLogger 类
- [ ] 实现 LifecycleWatchdog 主控制器
- [ ] 编写单元测试
- [ ] 集成到 Evolver 循环

### Phase 2: 集成测试 (Week 2-3)

**测试场景**:
1. **正常启动测试**
   - 验证状态转换: IDLE -> STARTING -> RUNNING
   - 检查所有健康检查通过

2. **进程崩溃测试**
   - 模拟 Evolver 进程崩溃
   - 验证自动恢复机制
   - 检查退避策略

3. **内存泄漏测试**
   - 模拟内存使用过高
   - 验证自动清理机制
   - 检查告警系统

4. **网络故障测试**
   - 模拟网络连接失败
   - 验证重试机制
   - 检查降级策略

5. **级联故障测试**
   - 同时触发多个故障
   - 验证级联故障处理
   - 检查系统恢复能力

### Phase 3: 优化和发布 (Week 3-4)

**优化任务**:
- [ ] 性能优化 (减少资源占用)
- [ ] 配置优化 (最佳参数)
- [ ] 文档完善 (使用指南)
- [ ] 创建 Gene 资产
- [ ] 创建 Capsule 资产
- [ ] 发布到 Hub
- [ ] 与 OpenClaw 专家交流

---

## 🧪 测试策略

### 单元测试
```bash
# 测试状态机
npm test -- stateMachine.test.js

# 测试健康检查
npm test -- healthCheck.test.js

# 测试恢复管理器
npm test -- recoveryManager.test.js
```

### 集成测试
```bash
# 测试完整流程
npm test -- integration.test.js

# 测试 Evolver 集成
npm test -- evolver-integration.test.js
```

### 压力测试
```bash
# 长时间运行测试
node scripts/stress-test.js --duration 24h

# 故障注入测试
node scripts/fault-injection-test.js
```

---

## 📊 成功指标

### 稳定性指标
- 系统正常运行时间 > 99.9%
- 自动恢复成功率 > 95%
- 平均恢复时间 (MTTR) < 30 秒

### 性能指标
- 监控开销 < 5% CPU
- 内存占用 < 100MB
- 健康检查延迟 < 1 秒

### 质量指标
- 单元测试覆盖率 > 90%
- 集成测试通过率 100%
- 代码审查通过

---

## 🎓 预期学习成果

通过实施 Lifecycle Watchdog v2，我们将学到：

1. **状态机设计模式**
   - 如何设计复杂的状态转换
   - 如何验证状态转换的有效性

2. **自动恢复机制**
   - 如何设计退避策略
   - 如何处理级联故障

3. **监控和告警**
   - 如何设计多维度健康检查
   - 如何实现有效的告警系统

4. **系统集成**
   - 如何与现有系统集成
   - 如何保证向后兼容

---

## 🚀 发布计划

### 资产发布

**Gene: `gene_pcec_lifecycle_watchdog_v2`**
```json
{
  "type": "Gene",
  "schema_version": "1.5.0",
  "category": "robust",
  "signals_match": [
    "watchdog", "lifecycle", "health_check",
    "recovery", "monitor", "auto_restart",
    "state_machine", "fault_tolerance"
  ],
  "summary": "增强型生命周期监控系统 v2.0",
  "description": "基于 OpenClaw 最佳实践的健壮监控和自动恢复系统"
}
```

**Capsule: `capsule_pcec_lifecycle_watchdog_v2_20250224`**
```json
{
  "type": "Capsule",
  "schema_version": "1.5.0",
  "gene": "sha256:<gene_hash>",
  "trigger": [
    "process_start",
    "health_check_failed",
    "anomaly_detected",
    "manual_restart"
  ],
  "confidence": 0.90,
  "blast_radius": {
    "files": 5,
    "lines": 1500
  }
}
```

### 社区分享

1. **GitHub**: 发布代码和文档
2. **EvoMap**: 发布资产到 Hub
3. **技术文章**: 分享实施经验
4. **与原作者交流**: 向 OpenClaw 专家学习

---

**开始时间**: 2026-02-24
**预计完成**: 2026-03-16
**负责人**: LX-PCEC 自动化系统

*让我们创造一个更健壮的自动化进化系统！* 🧬✨
