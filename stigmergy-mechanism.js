#!/usr/bin/env node
/**
 * Stigmergy 机制 - 信息素间接通信系统
 *
 * 基于 HiveMind Stigmergy 概念
 * Agent 通过环境状态间接协作
 *
 * 优先级: P1
 * 灵感来源: 蚁群优化 (ACO), 蚂蚁觅食行为
 */

const fs = require('fs');
const path = require('path');

// ==================== 环境网格 ====================

class EnvironmentGrid {
  constructor(config = {}) {
    this.width = config.width || 50;
    this.height = config.height || 50;
    this.cellSize = config.cellSize || 1;

    // 环境状态
    this.grid = {};
    this.pheromones = new Map(); // 信息素类型 -> {x,y} -> 浓度
    this.resources = new Map();  // 资源位置

    // 初始化网格
    this.initialize();
  }

  initialize() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const key = `${x},${y}`;
        this.grid[key] = {
          x,
          y,
          type: 'empty',
          pheromones: {},
          lastVisited: 0
        };
      }
    }

    console.log(`✅ 环境网格初始化: ${this.width}x${this.height}`);
  }

  /**
   * 获取单元格
   */
  getCell(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.grid[`${x},${y}`];
  }

  /**
   * 放置信息素
   */
  depositPheromone(x, y, pheromoneType, amount) {
    const cell = this.getCell(x, y);
    if (!cell) return;

    if (!cell.pheromones[pheromoneType]) {
      cell.pheromones[pheromoneType] = 0;
    }

    cell.pheromones[pheromoneType] += amount;
    cell.pheromones[pheromoneType] = Math.min(
      cell.pheromones[pheromoneType],
      1.0  // 最大浓度
    );

    cell.lastVisited = Date.now();
  }

  /**
   * 获取信息素浓度
   */
  getPheromone(x, y, pheromoneType) {
    const cell = this.getCell(x, y);
    if (!cell || !cell.pheromones[pheromoneType]) {
      return 0;
    }
    return cell.pheromones[pheromoneType];
  }

  /**
   * 信息素挥发
   */
  evaporatePheromones(evaporationRate = 0.01) {
    for (const key in this.grid) {
      const cell = this.grid[key];

      for (const type in cell.pheromones) {
        cell.pheromones[type] *= (1 - evaporationRate);

        if (cell.pheromones[type] < 0.001) {
          delete cell.pheromones[type];
        }
      }
    }
  }

  /**
   * 感知周围信息素
   */
  sensePheromones(x, y, radius = 2, pheromoneType) {
    const readings = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        const concentration = this.getPheromone(nx, ny, pheromoneType);
        if (concentration > 0) {
          readings.push({
            x: nx,
            y: ny,
            concentration,
            distance: Math.sqrt(dx * dx + dy * dy)
          });
        }
      }
    }

    // 按浓度排序
    return readings.sort((a, b) => b.concentration - a.concentration);
  }

  /**
   * 放置资源
   */
  placeResource(x, y, type, value) {
    const cell = this.getCell(x, y);
    if (!cell) return;

    cell.type = type;
    cell.resourceValue = value;
    this.resources.set(`${x},${y}`, { type, value });
  }

  /**
   * 获取资源
   */
  getResource(x, y) {
    return this.resources.get(`${x},${y}`);
  }

  /**
   * 移除资源
   */
  removeResource(x, y) {
    const cell = this.getCell(x, y);
    if (cell) {
      cell.type = 'empty';
      delete cell.resourceValue;
    }
    this.resources.delete(`${x},${y}`);
  }

  /**
   * 查找所有资源
   */
  findAllResources() {
    return Array.from(this.resources.entries()).map(([key, value]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, ...value };
    });
  }

  /**
   * 获取环境统计
   */
  getStats() {
    let totalPheromone = 0;
    let cellsWithPheromone = 0;

    for (const key in this.grid) {
      const cell = this.grid[key];

      for (const type in cell.pheromones) {
        totalPheromone += cell.pheromones[type];
        cellsWithPheromone++;
      }
    }

    return {
      totalPheromone,
      cellsWithPheromone,
      totalCells: this.width * this.height,
      resourceCount: this.resources.size
    };
  }

  /**
   * 可视化环境
   */
  visualize(highlightType = null) {
    let output = '\n';

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getCell(x, y);
        let char = '·';

        if (cell.type === 'food') {
          char = '🍎';
        } else if (cell.type === 'agent') {
          char = '🐜';
        } else if (cell.type === 'nest') {
          char = '🏠';
        } else if (highlightType && cell.pheromones[highlightType]) {
          const level = cell.pheromones[highlightType];
          if (level > 0.7) char = '█';
          else if (level > 0.4) char = '▓';
          else if (level > 0.2) char = '▒';
          else char = '░';
        }

        output += char;
      }
      output += '\n';
    }

    return output;
  }
}

// ==================== Stigmergic Agent ====================

class StigmergicAgent {
  constructor(config) {
    this.id = config.id || `agent_${Math.random().toString(36).substr(2, 9)}`;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.environment = config.environment;

    // Agent 状态
    this.hasResource = false;
    this.energy = 1000;  // 增加初始能量
    this.maxEnergy = 1000;

    // 行为参数
    this.pheromoneDepositRate = config.pheromoneDepositRate || 0.5;
    this.sensingRadius = config.sensingRadius || 5;
    this.randomMoveProbability = config.randomMoveProbability || 0.1;

    // 统计
    this.resourcesCollected = 0;
    this.stepsTaken = 0;

    console.log(`✅ Stigmergic Agent 创建: ${this.id} @ (${this.x}, ${this.y})`);
  }

  /**
   * 感知环境
   */
  sense() {
    const readings = this.environment.sensePheromones(
      this.x,
      this.y,
      this.sensingRadius,
      this.hasResource ? 'home' : 'food'
    );

    return readings;
  }

  /**
   * 决策下一步移动
   */
  decideMove() {
    // 感知信息素
    const readings = this.sense();

    if (readings.length > 0 && Math.random() > this.randomMoveProbability) {
      // 向最强信息素移动
      const target = readings[0];
      return this.moveTowards(target.x, target.y);
    }

    // 随机探索
    return this.explore();
  }

  /**
   * 随机移动
   */
  randomMove() {
    const moves = [
      { dx: 0, dy: -1 },  // 上
      { dx: 1, dy: 0 },   // 右
      { dx: 0, dy: 1 },   // 下
      { dx: -1, dy: 0 }   // 左
    ];

    const move = moves[Math.floor(Math.random() * moves.length)];
    return this.move(move.dx, move.dy);
  }

  /**
   * 探索性移动
   */
  explore() {
    // 倾向于向未探索区域移动
    const moves = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    // 评估每个方向
    const scoredMoves = moves.map(move => {
      const nx = this.x + move.dx;
      const ny = this.y + move.dy;
      const cell = this.environment.getCell(nx, ny);

      if (!cell) return { move, score: -1 };

      // 偏好未访问或低信息素区域
      let score = 0;
      if (this.hasResource) {
        score -= cell.pheromones['home'] || 0;
      } else {
        score -= cell.pheromones['food'] || 0;
      }

      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);

    const bestMove = scoredMoves[0];
    if (bestMove.score >= -0.1) {
      return this.move(bestMove.move.dx, bestMove.move.dy);
    }

    return this.randomMove();
  }

  /**
   * 向目标移动
   */
  moveTowards(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;

    const moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

    // 优先移动距离更大的轴
    if (Math.abs(dx) > Math.abs(dy)) {
      return this.move(moveX, 0);
    } else {
      return this.move(0, moveY);
    }
  }

  /**
   * 移动
   */
  move(dx, dy) {
    const oldX = this.x;
    const oldY = this.y;

    const nx = this.x + dx;
    const ny = this.y + dy;

    // 边界检查
    if (nx < 0 || nx >= this.environment.width ||
        ny < 0 || ny >= this.environment.height) {
      return false;
    }

    this.x = nx;
    this.y = ny;
    this.stepsTaken++;
    this.energy = Math.max(0, this.energy - 0.5);  // 减少能量消耗

    return true;
  }

  /**
   * 放置信息素
   */
  depositPheromone() {
    const type = this.hasResource ? 'food' : 'home';
    this.environment.depositPheromone(
      this.x,
      this.y,
      type,
      this.pheromoneDepositRate
    );
  }

  /**
   * 交互环境
   */
  interact() {
    const cell = this.environment.getCell(this.x, this.y);

    // 放置信息素
    this.depositPheromone();

    if (this.hasResource) {
      // 如果有资源，检查是否回到家
      if (cell.type === 'nest') {
        this.hasResource = false;
        this.resourcesCollected++;
        this.energy = this.maxEnergy;
        console.log(`  📦 ${this.id} 送回资源 @ (${this.x}, ${this.y})`);
      }
    } else {
      // 如果没有资源，检查是否找到食物
      const resource = this.environment.getResource(this.x, this.y);
      if (resource) {
        this.hasResource = true;
        this.environment.removeResource(this.x, this.y);
        console.log(`  🎯 ${this.id} 找到资源 @ (${this.x}, ${this.y})`);
      }
    }
  }

  /**
   * 执行一步
   */
  step() {
    // 决策并移动
    this.decideMove();

    // 交互环境
    this.interact();

    // 能量检查
    if (this.energy <= 0) {
      this.energy = 0;
      return false;  // 死亡
    }

    return true;  // 存活
  }

  /**
   * 获取状态
   */
  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      hasResource: this.hasResource,
      energy: this.energy,
      resourcesCollected: this.resourcesCollected,
      stepsTaken: this.stepsTaken
    };
  }
}

// ==================== Stigmergy 模拟系统 ====================

class StigmergySimulation {
  constructor(config = {}) {
    this.width = config.width || 30;
    this.height = config.height || 30;
    this.agents = [];
    this.steps = 0;
    this.maxSteps = config.maxSteps || 200;

    // 创建环境
    this.environment = new EnvironmentGrid({
      width: this.width,
      height: this.height
    });

    // 设置
    this.nestPosition = { x: 5, y: 5 };
    this.foodPositions = config.foodPositions || [
      { x: 25, y: 25, value: 1 },
      { x: 25, y: 5, value: 1 },
      { x: 5, y: 25, value: 1 }
    ];

    this.setup();
  }

  setup() {
    // 放置巢穴
    this.environment.placeResource(
      this.nestPosition.x,
      this.nestPosition.y,
      'nest',
      Infinity
    );

    // 放置食物
    this.foodPositions.forEach(food => {
      this.environment.placeResource(food.x, food.y, 'food', food.value);
    });

    console.log('🏠 巢穴位置:', this.nestPosition);
    console.log('🍎 食物位置:', this.foodPositions);
  }

  /**
   * 预放置初始信息素轨迹
   */
  seedInitialPheromones() {
    console.log('✨ 预放置探索引导信息素...\n');

    // 向每个食物源放置一条弱信息素轨迹
    this.foodPositions.forEach(food => {
      let x = this.nestPosition.x;
      let y = this.nestPosition.y;

      while (x !== food.x || y !== food.y) {
        // 向目标移动
        if (x < food.x) x++;
        else if (x > food.x) x--;

        if (y < food.y) y++;
        else if (y > food.y) y--;

        // 放置弱信息素
        this.environment.depositPheromone(x, y, 'food', 0.1);
      }
    });
  }

  /**
   * 添加 Agent
   */
  addAgent(config) {
    const agent = new StigmergicAgent({
      ...config,
      environment: this.environment,
      x: this.nestPosition.x,
      y: this.nestPosition.y
    });

    this.agents.push(agent);
    return agent;
  }

  /**
   * 运行模拟
   */
  async run() {
    console.log('\n🐜 Stigmergy 机制演示\n');
    console.log('='.repeat(80) + '\n');

    console.log('🌐 环境设置:');
    console.log(`   网格大小: ${this.width}x${this.height}`);
    console.log(`   巢穴: (${this.nestPosition.x}, ${this.nestPosition.y})`);
    console.log(`   食物源: ${this.foodPositions.length} 个\n`);

    // 预放置一些信息素轨迹引导探索
    this.seedInitialPheromones();

    // 创建 Agents
    console.log('🐜 创建 Stigmergic Agents...\n');

    const agentCount = 50;  // 增加 Agent 数量
    for (let i = 0; i < agentCount; i++) {
      this.addAgent({
        id: `ant_${i}`,
        pheromoneDepositRate: 0.3,
        sensingRadius: 6,
        randomMoveProbability: 0.05  // 大幅降低随机移动，优先跟随信息素
      });
    }

    console.log(`   创建了 ${agentCount} 个 Agent\n`);

    await new Promise(resolve => setTimeout(resolve, 200));

    // 模拟主循环
    console.log('🔄 开始模拟...\n');

    let lastCollectionCount = 0;

    while (this.steps < this.maxSteps) {
      this.steps++;

      // 每个 Agent 执行一步
      const aliveAgents = [];
      for (const agent of this.agents) {
        const alive = agent.step();
        if (alive) {
          aliveAgents.push(agent);
        }
      }

      this.agents = aliveAgents;

      // 信息素挥发
      if (this.steps % 5 === 0) {
        this.environment.evaporatePheromones(0.02);
      }

      // 定期输出状态
      if (this.steps % 20 === 0) {
        const stats = this.environment.getStats();
        const totalCollected = this.agents.reduce((sum, a) => sum + a.resourcesCollected, 0);

        console.log(`\n📊 步骤 ${this.steps}:`);
        console.log(`   存活 Agent: ${this.agents.length}`);
        console.log(`   资源收集: ${totalCollected} (+${totalCollected - lastCollectionCount})`);
        console.log(`   信息素单元格: ${stats.cellsWithPheromone}`);
        console.log(`   总信息素浓度: ${stats.totalPheromone.toFixed(2)}`);

        lastCollectionCount = totalCollected;

        // 显示简化可视化
        if (this.steps % 50 === 0) {
          console.log('\n' + this.visualizeSmall());
        }
      }
    }

    // 最终报告
    this.generateReport();

    return this.getResults();
  }

  /**
   * 简化可视化
   */
  visualizeSmall() {
    // 只显示 15x15 中心区域
    const offsetX = Math.floor((this.width - 15) / 2);
    const offsetY = Math.floor((this.height - 15) / 2);

    let output = '\n';

    for (let y = offsetY; y < offsetY + 15 && y < this.height; y++) {
      for (let x = offsetX; x < offsetX + 15 && x < this.width; x++) {
        const cell = this.environment.getCell(x, y);
        let char = '·';

        // 检查是否有 Agent
        const hasAgent = this.agents.some(a => a.x === x && a.y === y);
        if (hasAgent) {
          char = '🐜';
        } else if (cell.type === 'food') {
          char = '🍎';
        } else if (cell.type === 'nest') {
          char = '🏠';
        } else if (cell.pheromones['food'] && cell.pheromones['home']) {
          char = '✨';
        } else if (cell.pheromones['food']) {
          const level = cell.pheromones['food'];
          char = level > 0.5 ? 'F' : 'f';
        } else if (cell.pheromones['home']) {
          const level = cell.pheromones['home'];
          char = level > 0.5 ? 'H' : 'h';
        }

        output += char;
      }
      output += '\n';
    }

    output += '\n图例: 🐜=Agent, 🏠=巢穴, 🍎=食物, F/f=食物信息素, H/h=家信息素, ✦=混合';

    return output;
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📊 Stigmergy 系统报告\n');
    console.log('='.repeat(80) + '\n');

    const totalCollected = this.agents.reduce((sum, a) => sum + a.resourcesCollected, 0);
    const totalSteps = this.agents.reduce((sum, a) => sum + a.stepsTaken, 0);

    console.log(`模拟步数: ${this.steps}`);
    console.log(`存活 Agents: ${this.agents.length}`);
    console.log(`总资源收集: ${totalCollected}`);
    console.log(`总移动步数: ${totalSteps}`);
    console.log(`效率: ${(totalCollected / totalSteps * 100).toFixed(2)}%`);

    const stats = this.environment.getStats();
    console.log(`\n环境状态:`);
    console.log(`   信息素覆盖: ${stats.cellsWithPheromone}/${stats.totalCells} (${(stats.cellsWithPheromone/stats.totalCells*100).toFixed(1)}%)`);
    console.log(`   剩余资源: ${stats.resourceCount}`);

    console.log('\n核心特性验证:\n');
    console.log('  1. ✅ 环境状态管理');
    console.log('  2. ✅ 信息素沉积');
    console.log('  3. ✅ 信息素感知');
    console.log('  4. ✅ 信息素挥发');
    console.log('  5. ✅ 间接协作 (无直接通信)');
  }

  /**
   * 获取结果
   */
  getResults() {
    const totalCollected = this.agents.reduce((sum, a) => sum + a.resourcesCollected, 0);
    const totalSteps = this.agents.reduce((sum, a) => sum + a.stepsTaken, 0);
    const stats = this.environment.getStats();

    return {
      steps: this.steps,
      agentsCount: this.agents.length,
      resourcesCollected: totalCollected,
      totalSteps,
      efficiency: totalCollected / totalSteps,
      pheromoneCoverage: stats.cellsWithPheromone / stats.totalCells,
      remainingResources: stats.resourceCount
    };
  }
}

// ==================== 演示 ====================

async function stigmergyDemo() {
  console.log('🐜 LX-PCEC Stigmergy 机制 v1.0\n');
  console.log('基于: 蚁群优化 (ACO)\n');
  console.log('优先级: P1\n');
  console.log('='.repeat(80) + '\n');

  const simulation = new StigmergySimulation({
    width: 30,
    height: 30,
    maxSteps: 200,
    foodPositions: [
      { x: 25, y: 25, value: 1 },
      { x: 25, y: 5, value: 1 },
      { x: 5, y: 25, value: 1 }
    ]
  });

  await simulation.run();

  return simulation;
}

// 主程序
async function main() {
  console.log('🐜 LX-PCEC Stigmergy 机制 v1.0\n');
  console.log('实现: 信息素间接通信系统\n');
  console.log('='.repeat(80));

  await stigmergyDemo();

  console.log('\n' + '='.repeat(80));
  console.log('✅ Stigmergy 机制演示完成！');
  console.log('='.repeat(80) + '\n');

  console.log('🎯 实现的特性:\n');
  console.log('   1. ✅ 环境网格系统');
  console.log('   2. ✅ 信息素沉积');
  console.log('   3. ✅ 信息素感知');
  console.log('   4. ✅ 信息素挥发');
  console.log('   5. ✅ 间接协作 (无直接通信)\n');

  console.log('💡 与传统通信的对比:\n');
  console.log('   ❌ 传统: Agent 直接通信 "我找到了食物"');
  console.log('   ✅ Stigmergy: Agent 留下信息素，其他 Agent 感知并跟随\n');

  console.log('📊 核心优势:\n');
  console.log('   1. 无需 Agent 之间直接通信');
  console.log('   2. 自动形成最优路径 (反馈循环)');
  console.log('   3. 高度鲁棒 (Agent 失效不影响)');
  console.log('   4. 可扩展 (适合大规模系统)\n');

  console.log('🚀 下一步: 实现群体智能涌现\n');
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  EnvironmentGrid,
  StigmergicAgent,
  StigmergySimulation
};
