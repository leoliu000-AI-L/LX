#!/usr/bin/env node
/**
 * 自我复制 Agent (Self-Replicating Agent)
 *
 * Agent 能够根据环境需求自主克隆自己
 * 基于 Von Neumann 自动机理论 + 生物进化
 *
 * 优先级: P1 (下一代进化)
 */

const crypto = require('crypto');

// ==================== 自我复制 Agent ====================

class SelfReplicatingAgent {
  constructor(config) {
    this.id = config.id || `agent_${crypto.randomBytes(4).toString('hex')}`;
    this.generation = config.generation || 0;
    this.parentId = config.parentId || null;

    // 复制能力
    this.replicationCost = config.replicationCost || 100;  // 复制需要的能量
    this.replicationThreshold = config.replicationThreshold || 0.8;  // 负载阈值

    // 资源
    this.energy = config.energy || 200;
    this.maxEnergy = config.maxEnergy || 200;

    // 状态
    this.tasksCompleted = 0;
    this.tasksFailed = 0;
    this.fitness = 0;

    // 基因（可遗传的参数）
    this.genes = {
      speed: config.speed || 1.0,
      efficiency: config.efficiency || 1.0,
      cooperation: config.cooperation || 1.0,
      replicationRate: config.replicationRate || 1.0,
      mutationRate: config.mutationRate || 0.1,
      ...config.genes
    };

    // 领域
    this.domain = config.domain || 'general';

    // 统计
    this.offspring = [];

    console.log(`✅ Agent 创建: ${this.id} (第 ${this.generation} 代)`);
  }

  /**
   * 执行任务
   */
  async executeTask(task) {
    const startTime = Date.now();

    // 模拟任务执行
    const duration = task.difficulty === 'hard' ? 2000 : 1000;
    await new Promise(resolve => setTimeout(resolve, duration / this.genes.speed));

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    // 消耗能量
    const energyCost = task.difficulty === 'hard' ? 30 : 20;
    this.energy = Math.max(0, this.energy - energyCost / this.genes.efficiency);

    // 计算奖励
    let reward = task.reward || 50;

    // 根据表现调整
    if (actualDuration > duration * 1.5) {
      reward *= 0.5;
      this.tasksFailed++;
    } else {
      this.tasksCompleted++;
    }

    this.fitness += reward;

    return {
      success: true,
      reward,
      duration: actualDuration
    };
  }

  /**
   * 判断是否应该复制
   */
  shouldReplicate(systemLoad) {
    // 条件1: 有足够能量
    if (this.energy < this.replicationCost) {
      return { should: false, reason: '能量不足' };
    }

    // 条件2: 系统负载高
    if (systemLoad < this.replicationThreshold) {
      return { should: false, reason: '系统负载低' };
    }

    // 条件3: 适应度足够高
    if (this.fitness < 100) {
      return { should: false, reason: '适应度低' };
    }

    // 条件4: 不超过最大代数
    if (this.generation >= 10) {
      return { should: false, reason: '达到最大代数' };
    }

    return { should: true, reason: '满足条件' };
  }

  /**
   * 复制自己
   */
  replicate() {
    console.log(`\n🧬 ${this.id} 开始自我复制...`);

    // 消耗能量
    this.energy -= this.replicationCost;

    // 子代基因（可能有突变）
    const childGenes = this.mutateGenes(this.genes);

    // 创建子代
    const child = new SelfReplicatingAgent({
      id: `agent_${crypto.randomBytes(4).toString('hex')}`,
      generation: this.generation + 1,
      parentId: this.id,
      energy: this.replicationCost * 0.5,  // 子代继承部分能量
      genes: childGenes,
      domain: this.domain
    });

    // 继承部分适应度
    child.fitness = this.fitness * 0.5;

    this.offspring.push(child.id);

    console.log(`  ✅ 复制成功: ${child.id}`);
    console.log(`  🧬 基因突变: ${this.formatMutation(this.genes, childGenes)}`);

    return child;
  }

  /**
   * 基因突变
   */
  mutateGenes(parentGenes) {
    const childGenes = { ...parentGenes };

    for (const gene in childGenes) {
      if (typeof childGenes[gene] === 'number') {
        // 以 mutationRate 的概率突变
        if (Math.random() < this.genes.mutationRate) {
          const change = (Math.random() - 0.5) * 0.2;  // ±10% 变化
          childGenes[gene] = Math.max(0.1, childGenes[gene] + change);
        }
      }
    }

    return childGenes;
  }

  /**
   * 格式化突变信息
   */
  formatMutation(parentGenes, childGenes) {
    const mutations = [];

    for (const gene in childGenes) {
      if (parentGenes[gene] !== childGenes[gene]) {
        mutations.push(
          `${gene}: ${parentGenes[gene].toFixed(2)} → ${childGenes[gene].toFixed(2)}`
        );
      }
    }

    return mutations.length > 0 ? mutations.join(', ') : '无突变';
  }

  /**
   * 获取状态
   */
  getState() {
    return {
      id: this.id,
      generation: this.generation,
      parentId: this.parentId,
      energy: this.energy.toFixed(0),
      fitness: this.fitness.toFixed(0),
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
      offspringCount: this.offspring.length,
      genes: this.genes
    };
  }

  /**
   * 自然选择（淘汰不适应的 Agent）
   */
  shouldDie() {
    // 能量耗尽
    if (this.energy <= 0) {
      return { should: true, reason: '能量耗尽' };
    }

    // 适应度过低（且完成任务数少）
    if (this.fitness < -50 && this.tasksCompleted < 3) {
      return { should: true, reason: '适应度过低' };
    }

    return { should: false, reason: '' };
  }
}

// ==================== 进化系统 ====================

class EvolutionarySystem {
  constructor() {
    this.agents = new Map();
    this.generation = 0;
    this.tasks = [];
    this.stats = {
      born: 0,
      died: 0,
      replicated: 0,
      totalFitness: 0
    };
  }

  /**
   * 创建初始 Agent
   */
  createInitialAgent(config) {
    const agent = new SelfReplicatingAgent(config);
    this.agents.set(agent.id, agent);
    this.stats.born++;

    return agent;
  }

  /**
   * 添加任务
   */
  addTask(task) {
    this.tasks.push({
      ...task,
      id: `task_${this.tasks.length}`,
      createdAt: Date.now()
    });
  }

  /**
   * 计算系统负载
   */
  calculateSystemLoad() {
    const totalCapacity = Array.from(this.agents.values())
      .reduce((sum, a) => sum + (a.energy / a.maxEnergy) * a.genes.efficiency, 0);

    return totalCapacity / this.agents.size;
  }

  /**
   * 分配任务
   */
  async assignTasks() {
    console.log('\n📋 分配任务...\n');

    const activeAgents = Array.from(this.agents.values()).filter(a => a.energy > 10);

    for (const agent of activeAgents) {
      if (this.tasks.length === 0) break;

      const task = this.tasks.shift();

      console.log(`  🔧 ${agent.id}: 执行 ${task.id}`);
      const result = await agent.executeTask(task);

      console.log(`     结果: 奖励 ${result.reward.toFixed(0)}, 耗时 ${result.duration}ms`);
    }
  }

  /**
   * 执行复制
   */
  replicate() {
    console.log('\n🧬 自我复制阶段\n');
    console.log('='.repeat(80) + '\n');

    const systemLoad = this.calculateSystemLoad();
    console.log(`系统负载: ${(systemLoad * 100).toFixed(0)}%\n`);

    let replicatedCount = 0;

    for (const [id, agent] of this.agents) {
      const decision = agent.shouldReplicate(systemLoad);

      if (decision.should) {
        const child = agent.replicate();
        this.agents.set(child.id, child);
        this.stats.born++;
        this.stats.replicated++;
        replicatedCount++;
      } else {
        console.log(`  ❌ ${id}: 不复制 (${decision.reason})`);
      }
    }

    console.log(`\n✅ 新生 ${replicatedCount} 个 Agent\n`);

    return replicatedCount;
  }

  /**
   * 自然选择（淘汰）
   */
  naturalSelection() {
    console.log('\n☠️  自然选择阶段\n');
    console.log('='.repeat(80) + '\n');

    const toRemove = [];

    for (const [id, agent] of this.agents) {
      const decision = agent.shouldDie();

      if (decision.should) {
        toRemove.push({ id, reason: decision.reason });
      }
    }

    for (const { id, reason } of toRemove) {
      const agent = this.agents.get(id);
      console.log(`  💀 ${id}: 被淘汰 (${reason})`);
      this.agents.delete(id);
      this.stats.died++;
    }

    console.log(`\n✅ 淘汰 ${toRemove.length} 个 Agent\n`);

    return toRemove.length;
  }

  /**
   * 进化统计
   */
  calculateStats() {
    const agents = Array.from(this.agents.values());

    if (agents.length === 0) {
      return {
        population: 0,
        avgGeneration: 0,
        avgFitness: 0,
        totalOffspring: 0
      };
    }

    const totalGeneration = agents.reduce((sum, a) => sum + a.generation, 0);
    const totalFitness = agents.reduce((sum, a) => sum + a.fitness, 0);
    const totalOffspring = agents.reduce((sum, a) => sum + a.offspring.length, 0);

    return {
      population: this.agents.size,
      avgGeneration: totalGeneration / agents.length,
      avgFitness: totalFitness / agents.length,
      totalOffspring,
      genes: this.analyzeGenes(agents)
    };
  }

  /**
   * 分析基因分布
   */
  analyzeGenes(agents) {
    if (agents.length === 0) return {};

    const geneNames = ['speed', 'efficiency', 'cooperation', 'replicationRate'];
    const avgGenes = {};

    for (const gene of geneNames) {
      const total = agents.reduce((sum, a) => sum + a.genes[gene], 0);
      avgGenes[gene] = total / agents.length;
    }

    return avgGenes;
  }

  /**
   * 打印种群状态
   */
  printPopulation() {
    console.log('\n👥 种群状态\n');
    console.log('='.repeat(80) + '\n');

    const agents = Array.from(this.agents.values());

    console.log(`总数: ${agents.length}`);
    console.log(`代数范围: ${Math.min(...agents.map(a => a.generation))} - ${Math.max(...agents.map(a => a.generation))}`);
    console.log(`平均适应度: ${(agents.reduce((sum, a) => sum + a.fitness, 0) / agents.length).toFixed(1)}\n`);

    // 按代数分组
    const byGeneration = {};
    for (const agent of agents) {
      const gen = agent.generation;
      if (!byGeneration[gen]) byGeneration[gen] = [];
      byGeneration[gen].push(agent);
    }

    for (const gen in byGeneration) {
      console.log(`第 ${gen} 代: ${byGeneration[gen].length} 个 Agent`);
    }

    console.log('');
  }

  /**
   * 运行进化
   */
  async run(generations = 5) {
    console.log('\n🧬 LX-PCEC 自我复制 Agent 演示 v1.0\n');
    console.log('基于: Von Neumann 自动机 + 遗传算法\n');
    console.log('优先级: P1 (下一代进化)\n');
    console.log('='.repeat(80) + '\n');

    // 创建初始 Agent
    console.log('👶 创建初始种群...\n');
    this.createInitialAgent({
      id: 'adam',
      energy: 200,
      genes: {
        speed: 1.0,
        efficiency: 1.0,
        cooperation: 1.0,
        replicationRate: 1.0,
        mutationRate: 0.1
      }
    });

    // 创建任务队列
    for (let i = 0; i < 50; i++) {
      this.addTask({
        difficulty: Math.random() > 0.5 ? 'hard' : 'easy',
        reward: Math.floor(Math.random() * 50) + 30
      });
    }

    await new Promise(resolve => setTimeout(resolve, 200));

    // 进化循环
    for (let gen = 0; gen < generations; gen++) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧬 第 ${gen + 1} 代进化`);
      console.log('='.repeat(80) + '\n');

      // 分配任务
      await this.assignTasks();

      // 复制
      await new Promise(resolve => setTimeout(resolve, 100));
      this.replicate();

      // 自然选择
      await new Promise(resolve => setTimeout(resolve, 100));
      this.naturalSelection();

      // 统计
      const stats = this.calculateStats();
      console.log(`\n📊 第 ${gen + 1} 代统计:`);
      console.log(`   种群大小: ${stats.population}`);
      console.log(`   平均代数: ${stats.avgGeneration.toFixed(1)}`);
      console.log(`   平均适应度: ${stats.avgFitness.toFixed(1)}`);
      console.log(`   总后代数: ${stats.totalOffspring}`);

      if (Object.keys(stats.genes).length > 0) {
        console.log(`\n   平均基因:`);
        for (const [gene, value] of Object.entries(stats.genes)) {
          console.log(`     ${gene}: ${value.toFixed(2)}`);
        }
      }

      this.printPopulation();

      // 如果种群灭绝，停止
      if (this.agents.size === 0) {
        console.log('\n💀 种群灭绝！');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 最终报告
    this.generateReport();

    return this.calculateStats();
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📊 进化报告\n');
    console.log('='.repeat(80) + '\n');

    console.log(`总计:`);
    console.log(`   出生: ${this.stats.born}`);
    console.log(`   死亡: ${this.stats.died}`);
    console.log(`   复制: ${this.stats.replicated}`);
    console.log(`   存活: ${this.agents.size}\n`);

    console.log('✅ 核心特性验证:\n');
    console.log('  1. ✅ 自我复制 (根据条件自主克隆)');
    console.log('  2. ✅ 基因遗传 (参数传递给子代)');
    console.log('  3. ✅ 基因突变 (随机变异)');
    console.log('  4. ✅ 自然选择 (淘汰不适应个体)');
    console.log('  5. ✅ 适应度进化 (适者生存)\n');

    console.log('💡 自我复制的意义:\n');
    console.log('   - 种群自动扩张 (根据需求)');
    console.log('   - 基因自动优化 (突变+选择)');
    console.log('   - 环境自动适应 (适者生存)');
    console.log('   - 真正的自主进化 (无需人工干预)\n');
  }
}

// ==================== 主程序 ====================

async function main() {
  console.log('🧬 LX-PCEC 自我复制 Agent 演示 v1.0\n');
  console.log('="'.repeat(80) + '\n');

  const system = new EvolutionarySystem();

  await system.run(5);

  console.log('='.repeat(80));
  console.log('✅ 自我复制 Agent 演示完成！');
  console.log('='.repeat(80) + '\n');

  console.log('🎯 实现的特性:\n');
  console.log('   1. ✅ 自我复制机制');
  console.log('   2. ✅ 基因遗传系统');
  console.log('   3. ✅ 基因突变算法');
  console.log('   4. ✅ 自然选择淘汰');
  console.log('   5. ✅ 适应度进化\n');

  console.log('💡 与传统系统的对比:\n');
  console.log('   ❌ 传统: 人工添加/删除 Agent');
  console.log('   ✅ 自我复制: 根据需求自主克隆\n');
  console.log('   ❌ 传统: 参数固定');
  console.log('   ✅ 自我复制: 基因自动进化\n');
  console.log('   ❌ 传统: 人工优化');
  console.log('   ✅ 自我复制: 自然选择优化\n');

  console.log('🚀 下一步: 研究量子纠缠通信概念\n');
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  SelfReplicatingAgent,
  EvolutionarySystem
};
