/**
 * LX-PCEC 高级 Cron 系统模块 (Phase 17)
 * 集成自 BashClaw 的 cron.sh
 *
 * 来源: https://github.com/shareAI-lab/BashClaw
 * 文件: lib/cron.sh
 *
 * 特性:
 * - 三种调度类型: at / every / cron
 * - 指数退避
 * - 卡死作业检测
 * - 会话隔离
 * - 并发限制
 * - JSON 持久化
 */

const fs = require('fs');
const path = require('path');
const cronParser = require('cron-parser'); // 需要安装: npm install cron-parser

// ============================================================================
// 配置常量
// ============================================================================

const CONFIG = {
  DEFAULT_MAX_CONCURRENT: 1,
  DEFAULT_JOB_TIMEOUT: 600000,      // 10 分钟
  DEFAULT_STUCK_THRESHOLD: 7200000, // 2 小时
  DEFAULT_SESSION_RETENTION: 86400000, // 24 小时
  SESSION_REAP_INTERVAL: 300000,   // 5 分钟
  BACKOFF_STEPS: [30000, 60000, 300000, 900000, 3600000], // 30s, 1m, 5m, 15m, 1h
};

// ============================================================================
// 调度解析器
// ============================================================================

class ScheduleParser {
  /**
   * 解析调度表达式
   * 支持格式:
   * - {kind:"at", at:"ISO-timestamp"}
   * - {kind:"every", everyMs:number}
   * - {kind:"cron", expr:"...", tz:"UTC"}
   * - 标准 cron 表达式字符串
   */
  static parse(scheduleInput) {
    // 字符串输入（标准 cron 表达式）
    if (typeof scheduleInput === 'string') {
      return {
        kind: 'cron',
        expr: scheduleInput,
        tz: 'UTC',
      };
    }

    // JSON 对象输入
    if (typeof scheduleInput === 'object') {
      const { kind, at, everyMs, expr, tz } = scheduleInput;

      if (kind === 'at') {
        if (!at) throw new Error('at schedule requires "at" field');
        return { kind: 'at', at: new Date(at) };
      }

      if (kind === 'every') {
        if (typeof everyMs !== 'number') {
          throw new Error('every schedule requires numeric "everyMs" field');
        }
        return { kind: 'every', everyMs };
      }

      if (kind === 'cron') {
        if (!expr) throw new Error('cron schedule requires "expr" field');
        return {
          kind: 'cron',
          expr,
          tz: tz || 'UTC',
        };
      }
    }

    throw new Error(`Invalid schedule: ${JSON.stringify(scheduleInput)}`);
  }

  /**
   * 计算下次运行时间
   */
  static getNextRunTime(schedule, lastRun = null) {
    const parsed = this.parse(schedule);

    switch (parsed.kind) {
      case 'at':
        return parsed.at;

      case 'every':
        if (lastRun) {
          return new Date(lastRun.getTime() + parsed.everyMs);
        }
        return new Date(Date.now() + parsed.everyMs);

      case 'cron':
        try {
          const interval = cronParser.parseExpression(parsed.expr, {
            tz: parsed.tz,
            currentDate: lastRun || new Date(),
          });
          return interval.next();
        } catch (error) {
          throw new Error(`Invalid cron expression: ${parsed.expr}`);
        }

      default:
        throw new Error(`Unknown schedule kind: ${parsed.kind}`);
    }
  }

  /**
   * 验证调度表达式
   */
  static validate(scheduleInput) {
    try {
      this.parse(scheduleInput);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// ============================================================================
// 作业状态管理
// ============================================================================

class JobState {
  constructor(stateDir = './data/cron') {
    this.stateDir = stateDir;
    this.jobsFile = path.join(stateDir, 'jobs.json');
    this.lockFile = path.join(stateDir, 'jobs.lock');
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * 加载所有作业
   */
  loadJobs() {
    if (!fs.existsSync(this.jobsFile)) {
      return { version: 1, jobs: [] };
    }

    try {
      const content = fs.readFileSync(this.jobsFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load jobs:', error.message);
      return { version: 1, jobs: [] };
    }
  }

  /**
   * 保存所有作业
   */
  saveJobs(jobsData) {
    this.acquireLock();
    try {
      fs.writeFileSync(this.jobsFile, JSON.stringify(jobsData, null, 2), { mode: 0o600 });
    } finally {
      this.releaseLock();
    }
  }

  /**
   * 获取作业
   */
  getJob(jobId) {
    const jobsData = this.loadJobs();
    return jobsData.jobs.find(job => job.id === jobId);
  }

  /**
   * 添加作业
   */
  addJob(job) {
    const jobsData = this.loadJobs();

    // 检查 ID 是否存在
    if (jobsData.jobs.find(j => j.id === job.id)) {
      throw new Error(`Job already exists: ${job.id}`);
    }

    // 计算首次运行时间
    job.nextRun = ScheduleParser.getNextRunTime(job.schedule);
    job.created = new Date().toISOString();
    job.enabled = job.enabled !== false;

    jobsData.jobs.push(job);
    this.saveJobs(jobsData);

    return job;
  }

  /**
   * 更新作业
   */
  updateJob(jobId, updates) {
    const jobsData = this.loadJobs();
    const index = jobsData.jobs.findIndex(j => j.id === jobId);

    if (index === -1) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // 更新字段
    Object.assign(jobsData.jobs[index], updates);

    // 如果更新了调度，重新计算下次运行时间
    if (updates.schedule) {
      jobsData.jobs[index].nextRun = ScheduleParser.getNextRunTime(
        updates.schedule,
        jobsData.jobs[index].lastRun ? new Date(jobsData.jobs[index].lastRun) : null
      );
    }

    this.saveJobs(jobsData);
    return jobsData.jobs[index];
  }

  /**
   * 删除作业
   */
  deleteJob(jobId) {
    const jobsData = this.loadJobs();
    const index = jobsData.jobs.findIndex(j => j.id === jobId);

    if (index === -1) {
      throw new Error(`Job not found: ${jobId}`);
    }

    jobsData.jobs.splice(index, 1);
    this.saveJobs(jobsData);
  }

  /**
   * 获取所有作业
   */
  getAllJobs() {
    const jobsData = this.loadJobs();
    return jobsData.jobs;
  }

  /**
   * 获取启用的作业
   */
  getEnabledJobs() {
    return this.getAllJobs().filter(job => job.enabled);
  }

  /**
   * 获取应该运行的作业
   */
  getDueJobs() {
    const now = Date.now();
    return this.getEnabledJobs().filter(job => {
      return new Date(job.nextRun).getTime() <= now;
    });
  }

  /**
   * 文件锁（防止并发写入）
   */
  acquireLock() {
    const maxWait = 10000;
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      try {
        fs.writeFileSync(this.lockFile, process.pid.toString(), { flag: 'wx' });
        return;
      } catch (error) {
        // 锁文件已存在，检查进程是否还在运行
        try {
          const lockedPid = parseInt(fs.readFileSync(this.lockFile, 'utf8'));
          if (!this.isProcessRunning(lockedPid)) {
            // 进程已死，删除锁文件
            fs.unlinkSync(this.lockFile);
            continue;
          }
        } catch {}

        // 等待后重试
        this.sleep(100);
      }
    }

    // 超时，删除锁文件
    try {
      fs.unlinkSync(this.lockFile);
    } catch {}
  }

  releaseLock() {
    try {
      fs.unlinkSync(this.lockFile);
    } catch {}
  }

  isProcessRunning(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  sleep(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // busy wait (兼容性)
    }
  }
}

// ============================================================================
// 作业执行器
// ============================================================================

class JobExecutor {
  constructor(jobState, agentRunner) {
    this.jobState = jobState;
    this.agentRunner = agentRunner; // Agent 运行器函数
    this.runningJobs = new Map();
    this.jobHistory = new Map();
  }

  /**
   * 执行作业
   */
  async executeJob(job) {
    const jobId = job.id;

    // 检查并发限制
    const maxConcurrent = job.maxConcurrent || CONFIG.DEFAULT_MAX_CONCURRENT;
    const running = this.countRunningJobs(job.agentId);
    if (running >= maxConcurrent) {
      console.log(`Job ${jobId} skipped: max concurrent reached`);
      return;
    }

    // 检查是否卡死
    if (this.isJobStuck(jobId)) {
      console.log(`Job ${jobId} appears stuck, skipping`);
      return;
    }

    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    // 记录执行
    this.runningJobs.set(executionId, {
      jobId,
      agentId: job.agentId,
      startTime,
      timeout: job.timeout || CONFIG.DEFAULT_JOB_TIMEOUT,
    });

    try {
      console.log(`[Cron] Executing job ${jobId}: ${job.name || 'Unnamed'}`);

      // 记录历史
      this.recordHistory(jobId, {
        executionId,
        startTime: new Date(startTime).toISOString(),
        status: 'running',
      });

      // 执行任务
      let result;
      if (job.command) {
        result = await this.executeCommand(job);
      } else if (job.agentTask) {
        result = await this.executeAgentTask(job);
      } else {
        throw new Error('Job has no command or agentTask');
      }

      // 成功
      const endTime = Date.now();
      this.recordHistory(jobId, {
        executionId,
        endTime: new Date(endTime).toISOString(),
        status: 'success',
        result,
      });

      // 更新作业状态
      await this.jobState.updateJob(jobId, {
        lastRun: new Date(startTime).toISOString(),
        lastResult: 'success',
        nextRun: ScheduleParser.getNextRunTime(job.schedule, new Date(startTime)),
      });

      console.log(`[Cron] Job ${jobId} completed successfully`);

    } catch (error) {
      // 失败
      const endTime = Date.now();
      this.recordHistory(jobId, {
        executionId,
        endTime: new Date(endTime).toISOString(),
        status: 'error',
        error: error.message,
      });

      // 更新作业状态
      const failureCount = (job.failureCount || 0) + 1;
      await this.jobState.updateJob(jobId, {
        lastRun: new Date(startTime).toISOString(),
        lastResult: 'error',
        failureCount,
      });

      // 检查是否需要退避
      if (failureCount <= CONFIG.BACKOFF_STEPS.length) {
        const backoffMs = CONFIG.BACKOFF_STEPS[failureCount - 1];
        const backoffUntil = new Date(startTime + backoffMs);
        await this.jobState.updateJob(jobId, {
          nextRun: backoffUntil.toISOString(),
        });
        console.log(`[Cron] Job ${jobId} failed, backing off ${backoffMs}ms`);
      } else {
        // 禁用作业
        await this.jobState.updateJob(jobId, {
          enabled: false,
          disabledReason: 'Too many failures',
        });
        console.log(`[Cron] Job ${jobId} disabled after ${failureCount} failures`);
      }

    } finally {
      this.runningJobs.delete(executionId);
    }
  }

  /**
   * 执行命令
   */
  async executeCommand(job) {
    const { exec } = require('child_process');

    return new Promise((resolve, reject) => {
      const timeout = job.timeout || CONFIG.DEFAULT_JOB_TIMEOUT;
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Job timeout'));
      }, timeout);

      const child = exec(job.command, {
        cwd: job.cwd || process.cwd(),
        env: { ...process.env, ...job.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * 执行 Agent 任务
   */
  async executeAgentTask(job) {
    if (!this.agentRunner) {
      throw new Error('No agent runner configured');
    }

    return await this.agentRunner({
      agentId: job.agentId,
      task: job.agentTask,
      timeout: job.timeout || CONFIG.DEFAULT_JOB_TIMEOUT,
    });
  }

  /**
   * 检查作业是否卡死
   */
  isJobStuck(jobId) {
    for (const [execId, exec] of this.runningJobs.entries()) {
      if (exec.jobId === jobId) {
        const elapsed = Date.now() - exec.startTime;
        if (elapsed > exec.timeout) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 统计运行中的作业数
   */
  countRunningJobs(agentId) {
    let count = 0;
    for (const exec of this.runningJobs.values()) {
      if (exec.agentId === agentId) {
        count++;
      }
    }
    return count;
  }

  /**
   * 记录历史
   */
  recordHistory(jobId, record) {
    if (!this.jobHistory.has(jobId)) {
      this.jobHistory.set(jobId, []);
    }

    const history = this.jobHistory.get(jobId);
    history.push(record);

    // 保留最近 100 条记录
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 生成执行 ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Cron 调度器
// ============================================================================

class CronScheduler {
  constructor(config = {}) {
    this.stateDir = config.stateDir || './data/cron';
    this.jobState = new JobState(this.stateDir);
    this.executor = new JobExecutor(this.jobState, config.agentRunner);
    this.intervalId = null;
    this.tickInterval = config.tickInterval || 1000; // 1 秒
  }

  /**
   * 启动调度器
   */
  start() {
    if (this.intervalId) {
      console.log('[Cron] Scheduler already running');
      return;
    }

    console.log('[Cron] Starting scheduler');
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);

    // 启动会话清理
    this.startSessionReaper();
  }

  /**
   * 停止调度器
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[Cron] Scheduler stopped');
    }
  }

  /**
   * 调度器心跳
   */
  async tick() {
    try {
      const dueJobs = this.jobState.getDueJobs();

      for (const job of dueJobs) {
        // 异步执行，不阻塞
        setImmediate(() => {
          this.executor.executeJob(job).catch(error => {
            console.error(`[Cron] Job execution error:`, error.message);
          });
        });
      }
    } catch (error) {
      console.error('[Cron] Tick error:', error.message);
    }
  }

  /**
   * 会话清理器
   */
  startSessionReaper() {
    setInterval(() => {
      this.reapSessions();
    }, CONFIG.SESSION_REAP_INTERVAL);
  }

  /**
   * 清理过期会话
   */
  reapSessions() {
    const now = Date.now();
    const cutoff = now - CONFIG.DEFAULT_SESSION_RETENTION;

    // 清理执行历史
    for (const [jobId, history] of this.executor.jobHistory.entries()) {
      const filtered = history.filter(record => {
        const recordTime = new Date(record.startTime || record.endTime).getTime();
        return recordTime > cutoff;
      });

      if (filtered.length !== history.length) {
        this.executor.jobHistory.set(jobId, filtered);
      }
    }
  }

  /**
   * 添加作业
   */
  addJob(job) {
    return this.jobState.addJob(job);
  }

  /**
   * 更新作业
   */
  updateJob(jobId, updates) {
    return this.jobState.updateJob(jobId, updates);
  }

  /**
   * 删除作业
   */
  deleteJob(jobId) {
    return this.jobState.deleteJob(jobId);
  }

  /**
   * 获取作业
   */
  getJob(jobId) {
    return this.jobState.getJob(jobId);
  }

  /**
   * 获取所有作业
   */
  getAllJobs() {
    return this.jobState.getAllJobs();
  }

  /**
   * 手动运行作业
   */
  async runJob(jobId) {
    const job = this.jobState.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    return await this.executor.executeJob(job);
  }

  /**
   * 获取作业历史
   */
  getJobHistory(jobId) {
    return this.executor.jobHistory.get(jobId) || [];
  }

  /**
   * 获取状态
   */
  getStatus() {
    const jobs = this.jobState.getAllJobs();
    const running = this.executor.runningJobs.size;

    return {
      running: !!this.intervalId,
      totalJobs: jobs.length,
      enabledJobs: jobs.filter(j => j.enabled).length,
      disabledJobs: jobs.filter(j => !j.enabled).length,
      runningExecutions: running,
      stateDir: this.stateDir,
    };
  }
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 创建一次性定时任务 (at)
 */
function scheduleAt(name, timestamp, task) {
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    schedule: {
      kind: 'at',
      at: new Date(timestamp).toISOString(),
    },
    agentTask: task,
  };
}

/**
 * 创建周期性任务 (every)
 */
function scheduleEvery(name, intervalMs, task) {
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    schedule: {
      kind: 'every',
      everyMs: intervalMs,
    },
    agentTask: task,
  };
}

/**
 * 创建 Cron 任务 (cron)
 */
function scheduleCron(name, cronExpr, task) {
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    schedule: {
      kind: 'cron',
      expr: cronExpr,
      tz: 'UTC',
    },
    agentTask: task,
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  CronScheduler,
  JobState,
  JobExecutor,
  ScheduleParser,
  scheduleAt,
  scheduleEvery,
  scheduleCron,
  CONFIG,
};

// ============================================================================
// Demo
// ============================================================================

if (require.main === module) {
  async function demo() {
    console.log('⏰ LX-PCEC 高级 Cron 系统演示\n');

    // 创建调度器
    const scheduler = new CronScheduler({
      agentRunner: async ({ agentId, task }) => {
        console.log(`  → 执行 Agent 任务: ${agentId} - ${task}`);
        return { success: true };
      },
    });

    // 添加不同类型的作业
    console.log('1. 添加作业:');

    // 一次性任务
    const atJob = scheduler.addJob(scheduleAt(
      '一次性任务',
      Date.now() + 5000, // 5 秒后
      'Send greeting message'
    ));
    console.log(`   ✓ at 任务: ${atJob.name} (${new Date(atJob.nextRun).toLocaleString()})`);

    // 周期性任务
    const everyJob = scheduler.addJob(scheduleEvery(
      '周期性任务',
      10000, // 每 10 秒
      'Check system status'
    ));
    console.log(`   ✓ every 任务: ${everyJob.name} (每 10 秒)`);

    // Cron 任务
    const cronJob = scheduler.addJob(scheduleCron(
      'Cron 任务',
      '*/2 * * * *', // 每 2 分钟
      'Generate daily report'
    ));
    console.log(`   ✓ cron 任务: ${cronJob.name} (${cronJob.schedule.expr})`);

    // 获取状态
    console.log('\n2. 调度器状态:');
    const status = scheduler.getStatus();
    console.log(`   总作业数: ${status.totalJobs}`);
    console.log(`   启用作业: ${status.enabledJobs}`);
    console.log(`   禁用作业: ${status.disabledJobs}`);

    // 启动调度器
    console.log('\n3. 启动调度器...');
    scheduler.start();

    // 运行 30 秒
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 停止调度器
    console.log('\n4. 停止调度器...');
    scheduler.stop();

    // 查看作业历史
    console.log('\n5. 作业执行历史:');
    for (const job of scheduler.getAllJobs()) {
      const history = scheduler.getJobHistory(job.id);
      console.log(`   ${job.name}: ${history.length} 次执行`);
    }

    console.log('\n✅ Cron 系统演示完成');
  }

  demo().catch(console.error);
}
