#!/usr/bin/env node
/**
 * LX-PCEC Multi-Agent Framework v1.0
 *
 * 基于 MetaGPT, CrewAI, AutoGen 研究成果
 * 实现 Role-Playing Pattern 和 Conversation Pattern
 */

const fs = require('fs');
const path = require('path');

// ==================== 核心类定义 ====================

/**
 * 消息类 - Agent 间通信的基本单位
 */
class Message {
  constructor(from, to, content, type = 'text') {
    this.id = this.generateId();
    this.from = from;      // 发送者 Agent ID
    this.to = to;          // 接收者 Agent ID (可以是数组用于广播)
    this.content = content;
    this.type = type;      // text, action, result, error
    this.timestamp = Date.now();
    this.replyTo = null;    // 回复的消息 ID
  }

  generateId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  reply(content, type = 'text') {
    const replyMsg = new Message(this.to, this.from, content, type);
    replyMsg.replyTo = this.id;
    return replyMsg;
  }

  toString() {
    return `[${new Date(this.timestamp).toISOString()}] ${this.from} → ${this.to}: ${this.content}`;
  }
}

/**
 * 工具类 - Agent 可以使用的外部能力
 */
class Tool {
  constructor(config) {
    this.name = config.name;
    this.description = config.description;
    this.parameters = config.parameters || {};
    this.handler = config.handler;
  }

  async execute(params) {
    if (!this.handler) {
      throw new Error(`Tool ${this.name} has no handler`);
    }
    return await this.handler(params);
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }
}

/**
 * 记忆类 - Agent 的记忆系统
 */
class Memory {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.shortTerm = [];     // 短期记忆 (最近对话)
    this.longTerm = new Map(); // 长期记忆 (重要事实)
    this.episodic = [];       // 情景记忆 (事件序列)
  }

  add(message) {
    // 添加到短期记忆
    this.shortTerm.push({
      type: 'message',
      data: message,
      timestamp: Date.now()
    });

    // 限制容量
    if (this.shortTerm.length > this.capacity) {
      this.shortTerm.shift();
    }

    // 添加到情景记忆
    this.episodic.push({
      type: 'message',
      data: message,
      timestamp: Date.now()
    });
  }

  addFact(key, value) {
    this.longTerm.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  getFact(key) {
    const fact = this.longTerm.get(key);
    if (fact) {
      fact.accessCount++;
      return fact.value;
    }
    return null;
  }

  getRecentContext(limit = 10) {
    return this.shortTerm.slice(-limit);
  }

  search(query) {
    const results = [];

    // 搜索短期记忆
    this.shortTerm.forEach(mem => {
      if (JSON.stringify(mem.data).toLowerCase().includes(query.toLowerCase())) {
        results.push(mem);
      }
    });

    // 搜索长期记忆
    this.longTerm.forEach((value, key) => {
      if (key.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(value).toLowerCase().includes(query.toLowerCase())) {
        results.push({ type: 'fact', key, data: value });
      }
    });

    return results;
  }

  summarize() {
    return {
      shortTerm: this.shortTerm.length,
      longTerm: this.longTerm.size,
      episodic: this.episodic.length
    };
  }
}

/**
 * Agent 基类 - 实现 Role-Playing Pattern
 */
class Agent {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.name = config.name;
    this.role = config.role;           // 角色 (如: Product Manager, Engineer)
    this.goal = config.goal;           // 目标
    this.backstory = config.backstory || ''; // 背景故事

    // 能力
    this.memory = new Memory(config.memoryCapacity || 100);
    this.tools = new Map();           // 可用工具

    // 状态
    this.status = 'idle';             // idle, thinking, acting
    this.messageQueue = [];
    this.context = {};

    // 统计
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      actionsPerformed: 0,
      toolsUsed: 0
    };
  }

  generateId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加工具
   */
  addTool(tool) {
    if (!(tool instanceof Tool)) {
      tool = new Tool(tool);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * 使用工具
   */
  async useTool(toolName, params) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    this.stats.toolsUsed++;
    return await tool.execute(params);
  }

  /**
   * 接收消息
   */
  receive(message) {
    this.messageQueue.push(message);
    this.memory.add(message);
    this.stats.messagesReceived++;
  }

  /**
   * 发送消息
   */
  send(to, content, type = 'text') {
    const message = new Message(this.id, to, content, type);
    this.stats.messagesSent++;
    return message;
  }

  /**
   * 思考 - 核心决策逻辑
   * 子类应该重写此方法实现具体智能
   */
  async think(context) {
    // 获取最近的上下文
    const recentContext = this.memory.getRecentContext();

    // 分析当前情况
    const analysis = {
      role: this.role,
      goal: this.goal,
      recentMessages: recentContext,
      currentContext: context
    };

    // 默认行为: 简单回复
    return {
      action: 'reply',
      content: `I am ${this.name}, a ${this.role}. I received: ${context.lastMessage?.content || 'nothing'}`
    };
  }

  /**
   * 行动 - 执行具体动作
   */
  async act(action) {
    this.status = 'acting';
    this.stats.actionsPerformed++;

    try {
      let result;

      switch (action.type) {
        case 'reply':
          result = action.content;
          break;

        case 'use_tool':
          result = await this.useTool(action.tool, action.params);
          break;

        case 'delegate':
          result = await this.delegate(action.task, action.to);
          break;

        default:
          result = await this.customAction(action);
      }

      this.status = 'idle';
      return { success: true, result };

    } catch (error) {
      this.status = 'error';
      return { success: false, error: error.message };
    }
  }

  /**
   * 委派任务给其他 Agent
   */
  async delegate(task, to) {
    const message = this.send(to, {
      type: 'task',
      task: task,
      from: this.id
    }, 'action');

    return message;
  }

  /**
   * 自定义动作 - 子类可重写
   */
  async customAction(action) {
    throw new Error(`Action ${action.type} not implemented`);
  }

  /**
   * 处理消息队列
   */
  async processMessages() {
    const results = [];

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();

      // 思考如何处理
      const decision = await this.think({
        lastMessage: message,
        context: this.context
      });

      // 执行动作
      const result = await this.act(decision);

      results.push({
        message,
        decision,
        result
      });
    }

    return results;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      status: this.status,
      queueSize: this.messageQueue.length,
      memory: this.memory.summarize(),
      tools: Array.from(this.tools.keys()),
      stats: this.stats
    };
  }

  toString() {
    return `${this.name} (${this.role})`;
  }
}

// ==================== 具体角色实现 ====================

/**
 * Product Manager Agent
 */
class ProductManagerAgent extends Agent {
  constructor(config) {
    super({
      ...config,
      role: 'Product Manager',
      goal: 'Define product requirements and roadmap'
    });

    // 添加工具
    this.addTool(new Tool({
      name: 'write_prd',
      description: 'Write a Product Requirements Document',
      parameters: { features: 'array', priorities: 'array' },
      handler: async (params) => {
        return {
          type: 'prd',
          content: `# Product Requirements Document\n\n## Features\n${params.features.map(f => `- ${f}`).join('\n')}\n\n## Priorities\n${params.priorities.map(p => `- ${p}`).join('\n')}`
        };
      }
    }));
  }

  async think(context) {
    const recentMessages = this.memory.getRecentContext();

    // 如果收到任务请求
    if (context.lastMessage?.type === 'task') {
      return {
        action: 'reply',
        content: {
          type: 'requirements',
          requirements: ['User authentication', 'Data dashboard', 'API integration'],
          priorities: ['P0: Authentication', 'P1: Dashboard', 'P2: API']
        }
      };
    }

    // 默认: 分析需求
    return {
      action: 'use_tool',
      tool: 'write_prd',
      params: {
        features: ['User Management', 'Real-time Analytics', 'Multi-agent Support'],
        priorities: ['P0: User Management', 'P1: Analytics', 'P2: Multi-agent']
      }
    };
  }
}

/**
 * Engineer Agent
 */
class EngineerAgent extends Agent {
  constructor(config) {
    super({
      ...config,
      role: 'Engineer',
      goal: 'Implement technical solutions'
    });

    this.addTool(new Tool({
      name: 'write_code',
      description: 'Write implementation code',
      parameters: { specifications: 'object' },
      handler: async (params) => {
        return {
          type: 'code',
          language: 'javascript',
          content: `// Implementation for ${params.specifications.feature}\n` +
                   `class ${params.specifications.className} {\n` +
                   `  constructor() {}\n` +
                   `  // TODO: Implement\n` +
                   `}\n`
        };
      }
    }));
  }

  async think(context) {
    const recentMessages = this.memory.getRecentContext();

    // 如果收到 PRD
    if (context.lastMessage?.content?.type === 'prd') {
      return {
        action: 'reply',
        content: {
          type: 'implementation_plan',
          tasks: ['Setup project structure', 'Implement core features', 'Write tests'],
          estimate: '3 days'
        }
      };
    }

    // 默认: 写代码
    return {
      action: 'use_tool',
      tool: 'write_code',
      params: {
        specifications: {
          feature: 'Multi-Agent System',
          className: 'MultiAgentFramework'
        }
      }
    };
  }
}

/**
 * QA Engineer Agent
 */
class QAAgent extends Agent {
  constructor(config) {
    super({
      ...config,
      role: 'QA Engineer',
      goal: 'Ensure quality and test coverage'
    });

    this.addTool(new Tool({
      name: 'write_tests',
      description: 'Write test cases',
      parameters: { feature: 'string', scenarios: 'array' },
      handler: async (params) => {
        return {
          type: 'tests',
          framework: 'jest',
          content: `describe('${params.feature}', () => {\n` +
                   params.scenarios.map(s => `  it('${s}', () => {\n` +
                   `    // TODO: Implement test\n` +
                   `  });\n`).join('') +
                   `});\n`
        };
      }
    }));
  }

  async think(context) {
    const recentMessages = this.memory.getRecentContext();

    // 如果收到实现计划
    if (context.lastMessage?.content?.type === 'implementation_plan') {
      return {
        action: 'reply',
        content: {
          type: 'test_plan',
          testCases: ['Unit tests for core features', 'Integration tests', 'E2E tests'],
          coverage: 'target: 80%'
        }
      };
    }

    return {
      action: 'use_tool',
      tool: 'write_tests',
      params: {
        feature: 'Multi-Agent System',
        scenarios: ['should create agents', 'should send messages', 'should process tasks']
      }
    };
  }
}

// ==================== 协作系统 ====================

/**
 * Multi-Agent 协作系统
 */
class MultiAgentSystem {
  constructor(config = {}) {
    this.name = config.name || 'Multi-Agent System';
    this.agents = new Map();
    this.messageBus = [];
    this.logs = [];
  }

  /**
   * 添加 Agent
   */
  addAgent(agent) {
    this.agents.set(agent.id, agent);
    this.log(`Agent added: ${agent}`);
  }

  /**
   * 获取 Agent
   */
  getAgent(id) {
    return this.agents.get(id);
  }

  /**
   * 广播消息给所有 Agent
   */
  broadcast(from, content, type = 'text') {
    const recipients = Array.from(this.agents.keys()).filter(id => id !== from);

    recipients.forEach(to => {
      const message = new Message(from, to, content, type);
      this.messageBus.push(message);
    });

    this.log(`Broadcast from ${from} to ${recipients.length} agents`);
  }

  /**
   * 发送消息
   */
  sendMessage(from, to, content, type = 'text') {
    const message = new Message(from, to, content, type);
    this.messageBus.push(message);

    const toAgent = this.agents.get(to);
    if (toAgent) {
      toAgent.receive(message);
    }

    this.log(`Message: ${from} → ${to}`);
    return message;
  }

  /**
   * 投递消息
   */
  deliverMessages() {
    this.messageBus.forEach(msg => {
      const agent = this.agents.get(msg.to);
      if (agent) {
        agent.receive(msg);
      }
    });
    this.messageBus = [];
  }

  /**
   * 运行一轮协作
   */
  async runRound() {
    this.log('=== Starting round ===');

    const results = [];

    // 让每个 Agent 处理消息
    for (const [id, agent] of this.agents) {
      if (agent.messageQueue.length > 0) {
        this.log(`${agent} processing ${agent.messageQueue.length} messages...`);
        const agentResults = await agent.processMessages();
        results.push(...agentResults);

        // 处理结果中的新消息
        agentResults.forEach(result => {
          if (result.decision?.action === 'reply' && result.result?.result) {
            // 如果是回复，发送回复消息
            const originalMsg = result.message;
            if (originalMsg.replyTo) {
              // 这是一个回复
            }
          }
        });
      }
    }

    this.log(`=== Round complete: ${results.length} actions ===`);
    return results;
  }

  /**
   * 运行完整工作流
   */
  async runWorkflow(rounds = 5) {
    this.log(`Starting workflow: ${rounds} rounds`);

    const history = [];

    for (let i = 0; i < rounds; i++) {
      this.log(`\n--- Round ${i + 1}/${rounds} ---`);

      // 投递消息
      this.deliverMessages();

      // 运行一轮
      const results = await this.runRound();
      history.push({ round: i + 1, results });

      // 如果没有更多消息，提前结束
      const totalQueued = Array.from(this.agents.values())
        .reduce((sum, agent) => sum + agent.messageQueue.length, 0);

      if (totalQueued === 0) {
        this.log('No more messages, ending workflow');
        break;
      }
    }

    return history;
  }

  /**
   * 获取系统状态
   */
  getStatus() {
    return {
      name: this.name,
      agents: Array.from(this.agents.values()).map(a => a.getStatus()),
      messageBus: this.messageBus.length,
      logs: this.logs.length
    };
  }

  /**
   * 日志
   */
  log(message) {
    const entry = {
      timestamp: new Date().toISOString(),
      message
    };
    this.logs.push(entry);
    console.log(`[${entry.timestamp}] ${message}`);
  }

  /**
   * 生成报告
   */
  generateReport() {
    const status = this.getStatus();

    let report = `# Multi-Agent System Report\n\n`;
    report += `## System Overview\n\n`;
    report += `- **Name**: ${this.name}\n`;
    report += `- **Agents**: ${status.agents.length}\n`;
    report += `- **Messages in Bus**: ${status.messageBus}\n`;
    report += `- **Log Entries**: ${status.logs}\n\n`;

    report += `## Agents\n\n`;
    status.agents.forEach((agent, i) => {
      report += `### ${i + 1}. ${agent.name}\n\n`;
      report += `- **Role**: ${agent.role}\n`;
      report += `- **Status**: ${agent.status}\n`;
      report += `- **Messages Received**: ${agent.stats.messagesReceived}\n`;
      report += `- **Messages Sent**: ${agent.stats.messagesSent}\n`;
      report += `- **Actions Performed**: ${agent.stats.actionsPerformed}\n`;
      report += `- **Tools Used**: ${agent.stats.toolsUsed}\n`;
      report += `- **Available Tools**: ${agent.tools.join(', ') || 'None'}\n\n`;
    });

    return report;
  }
}

// ==================== 示例场景 ====================

/**
 * 软件开发团队场景
 */
async function softwareTeamDemo() {
  console.log('🚀 Software Development Team Demo\n');
  console.log('='.repeat(80) + '\n');

  // 创建系统
  const system = new MultiAgentSystem({ name: 'Software Dev Team' });

  // 创建 Agent
  const pm = new ProductManagerAgent({
    name: 'Alice',
    goal: 'Define product requirements'
  });

  const engineer = new EngineerAgent({
    name: 'Bob',
    goal: 'Implement features'
  });

  const qa = new QAAgent({
    name: 'Charlie',
    goal: 'Ensure quality'
  });

  // 添加到系统
  system.addAgent(pm);
  system.addAgent(engineer);
  system.addAgent(qa);

  console.log('✅ Team assembled:\n');
  console.log(`   1. ${pm}`);
  console.log(`   2. ${engineer}`);
  console.log(`   3. ${qa}\n`);

  // PM 发起任务
  console.log('📋 PM starting workflow...\n');
  const taskMsg = system.sendMessage(
    pm.id,
    engineer.id,
    { type: 'task', task: 'Build Multi-Agent System' },
    'action'
  );

  // 运行工作流
  console.log('\n⚙️  Running workflow...\n');
  const history = await system.runWorkflow(3);

  // 生成报告
  console.log('\n📊 System Report:\n');
  console.log(system.generateReport());

  return system;
}

// ==================== 主程序 ====================

async function main() {
  console.log('🌟 LX-PCEC Multi-Agent Framework v1.0\n');
  console.log('基于研究成果:');
  console.log('- MetaGPT: Role-Playing, Document-Driven');
  console.log('- CrewAI: Crew Formation, Process Definition');
  console.log('- AutoGen: Conversation Pattern');
  console.log('- LobeHub: Agent Teammates\n');
  console.log('='.repeat(80) + '\n');

  // 运行示例
  await softwareTeamDemo();

  console.log('\n' + '='.repeat(80));
  console.log('✅ Multi-Agent Framework Demo Complete!');
  console.log('='.repeat(80) + '\n');

  console.log('🎯 下一步:');
  console.log('1. 扩展更多角色 (Architect, Designer, etc.)');
  console.log('2. 实现复杂的协作流程');
  console.log('3. 集成到 EvoMap Hub');
  console.log('4. 创建可复用的 Capsule 技能\n');
}

// 导出模块
module.exports = {
  Message,
  Tool,
  Memory,
  Agent,
  ProductManagerAgent,
  EngineerAgent,
  QAAgent,
  MultiAgentSystem
};

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}
