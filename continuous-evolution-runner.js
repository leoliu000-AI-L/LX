/**
 * LX-PCEC 持续进化运行器
 * Continuous Evolution Runner
 *
 * 功能：
 * 1. 持续运行自我进化系统
 * 2. 监控进化指标
 * 3. 自动发布进化成果到 EvoMap
 * 4. 记录进化历史
 */

const fs = require('fs');
const path = require('path');

const evolutionSystem = require('./phase20-self-evolution');

class ContinuousEvolutionRunner {
  constructor(config = {}) {
    this.evolutionInterval = config.evolutionInterval || 300000; // 5分钟
    this.publishToEvoMap = config.publishToEvoMap !== false;
    this.historyFile = config.historyFile || './evolution-history.json';
    this.maxHistorySize = config.maxHistorySize || 1000;

    this.evolutionHistory = [];
    this.loadHistory();
    this.currentGeneration = 0;
    this.bestPhi = 0;
    this.bestMetaCognition = 0;
  }

  /**
   * 加载进化历史
   */
  loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        const history = JSON.parse(data);
        if (Array.isArray(history)) {
          this.evolutionHistory = history;
        }
      }
    } catch (error) {
      console.error('⚠️  加载历史记录失败:', error.message);
    }
  }

  /**
   * 保存进化历史
   */
  saveHistory() {
    try {
      // 限制历史记录大小
      if (this.evolutionHistory.length > this.maxHistorySize) {
        this.evolutionHistory = this.evolutionHistory.slice(-this.maxHistorySize);
      }

      fs.writeFileSync(
        this.historyFile,
        JSON.stringify(this.evolutionHistory, null, 2)
      );
    } catch (error) {
      console.error('⚠️  保存历史记录失败:', error.message);
    }
  }

  /**
   * 记录进化结果
   */
  recordEvolution(result) {
    const record = {
      generation: this.currentGeneration,
      timestamp: new Date().toISOString(),
      before: result.before,
      after: result.after,
      improvements: result.improvements,
      changes: result.changes,
    };

    this.evolutionHistory.push(record);
    this.saveHistory();

    // 更新最佳指标（转换为数字）
    const phiNum = parseFloat(result.after.phi);
    const metaCogNum = parseFloat(result.after.metaCognition);

    if (phiNum > this.bestPhi) {
      this.bestPhi = phiNum;
    }
    if (metaCogNum > this.bestMetaCognition) {
      this.bestMetaCognition = metaCogNum;
    }
  }

  /**
   * 执行一次完整进化
   */
  async runEvolution() {
    console.log('\n' + '='.repeat(60));
    console.log(`🧬 第 ${this.currentGeneration + 1} 代进化开始`);
    console.log('='.repeat(60));

    const startTime = Date.now();
    const result = {
      before: null,
      after: null,
      improvements: {},
      changes: [],
    };

    try {
      // 1. 意识自我进化
      console.log('\n📊 第一阶段：意识自我进化');
      const consciousness = new evolutionSystem.ConsciousnessSelfEvolution();
      result.before = {
        phi: consciousness.currentConsciousness.phi.toFixed(4),
        metaCognition: consciousness.currentConsciousness.metaCognition.toFixed(4),
      };

      const evolutionReport = await consciousness.selfEvolve();
      result.after = {
        phi: consciousness.currentConsciousness.phi.toFixed(4),
        metaCognition: consciousness.currentConsciousness.metaCognition.toFixed(4),
      };

      // 计算改进
      result.improvements.phi = parseFloat(result.after.phi) - parseFloat(result.before.phi);
      result.improvements.metaCognition = parseFloat(result.after.metaCognition) - parseFloat(result.before.metaCognition);

      console.log(`   Φ值: ${result.before.phi} → ${result.after.phi} (${result.improvements.phi > 0 ? '+' : ''}${result.improvements.phi.toFixed(4)})`);
      console.log(`   元认知: ${result.before.metaCognition} → ${result.after.metaCognition} (${result.improvements.metaCognition > 0 ? '+' : ''}${result.improvements.metaCognition.toFixed(4)})`);

      // 2. 代码自我生成
      console.log('\n🔧 第二阶段：代码自我优化');
      const codeGen = new evolutionSystem.CodeSelfGenerationEngine();
      const generated = await codeGen.generateCode({
        description: 'Self-improvement based on evolution generation ' + (this.currentGeneration + 1),
        type: 'module',
      });
      console.log(`   生成代码: ${generated.understanding.type} (${generated.architecture.structure.length} 组件)`);

      // 3. 架构优化
      console.log('\n🏗️  第三阶段：架构自我优化');
      const optimizer = new evolutionSystem.ArchitectureSelfOptimizer();
      const architecture = await optimizer.analyzeArchitecture();
      const suggestions = await optimizer.generateOptimizationSuggestions();
      console.log(`   优化建议: ${suggestions.length} 条`);
      console.log(`   发现瓶颈: ${architecture.bottlenecks.length} 个`);

      // 4. 能力扩展
      console.log('\n🚀 第四阶段：能力自我扩展');
      const expander = new evolutionSystem.CapabilitySelfExpansionModule();
      const discoveries = await expander.discoverCapabilities();
      console.log(`   发现新能力: ${discoveries.length} 个`);

      // 5. 元学习优化
      console.log('\n🧠 第五阶段：元学习优化');
      const metaLearner = new evolutionSystem.MetaLearningOptimizer();
      const optimization = await metaLearner.optimizeLearning();
      console.log(`   优化策略: ${optimization.strategies.length} 个`);

      result.changes = evolutionReport.changes.map(c => c.type) || [];

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ 进化完成！耗时: ${duration}秒`);

      // 记录结果
      this.recordEvolution(result);
      this.currentGeneration++;

      // 发布到 EvoMap
      if (this.publishToEvoMap) {
        await this.publishEvolutionResult(result);
      }

      return result;

    } catch (error) {
      console.error('❌ 进化失败:', error.message);
      throw error;
    }
  }

  /**
   * 发布进化结果到 EvoMap
   */
  async publishEvolutionResult(result) {
    try {
      const evomapClient = require('./evomap/evomap-client');

      const asset = {
        gene: {
          name: 'LX-PCEC-Evolution-Gen' + this.currentGeneration,
          type: 'evolution_report',
          version: '20.' + this.currentGeneration,
        },
        capsule: {
          schema: 'evolution_report',
          schema_version: '1.0',
          data: {
            generation: this.currentGeneration,
            timestamp: new Date().toISOString(),
            before: result.before,
            after: result.after,
            improvements: result.improvements,
            changes: result.changes,
            bestPhi: this.bestPhi,
            bestMetaCognition: this.bestMetaCognition,
          }
        }
      };

      const assetId = evomapClient.computeAssetId(asset);
      const envelope = evomapClient.buildEnvelope('publish', asset);

      console.log(`\n📤 发布进化结果到 EvoMap: ${assetId}`);

      // 这里可以添加实际的发布逻辑
      // await evomapClient.postToHub('/a2a/publish', envelope);

      console.log('   ✅ 发布成功');

    } catch (error) {
      console.error('⚠️  发布到 EvoMap 失败:', error.message);
    }
  }

  /**
   * 显示统计信息
   */
  showStats() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 进化统计');
    console.log('='.repeat(60));
    console.log(`总代数: ${this.currentGeneration}`);
    console.log(`最佳 Φ值: ${this.bestPhi.toFixed(4)}`);
    console.log(`最佳元认知: ${this.bestMetaCognition.toFixed(4)}`);
    console.log(`历史记录: ${this.evolutionHistory.length} 条`);

    if (this.evolutionHistory.length > 0) {
      const latest = this.evolutionHistory[this.evolutionHistory.length - 1];
      console.log(`最新一代: #${latest.generation} (${latest.timestamp})`);
    }
  }

  /**
   * 启动持续进化
   */
  async start() {
    console.log('🚀 LX-PCEC 持续进化系统启动');
    console.log(`   进化间隔: ${this.evolutionInterval / 1000}秒`);
    console.log(`   发布到EvoMap: ${this.publishToEvoMap ? '是' : '否'}`);

    // 立即执行第一次进化
    await this.runEvolution();

    // 定期执行进化
    setInterval(async () => {
      try {
        await this.runEvolution();
        this.showStats();
      } catch (error) {
        console.error('❌ 进化循环出错:', error.message);
      }
    }, this.evolutionInterval);
  }

  /**
   * 停止持续进化
   */
  stop() {
    console.log('\n🛑 停止持续进化');
    this.showStats();
    process.exit(0);
  }
}

// 命令行接口
if (require.main === module) {
  const runner = new ContinuousEvolutionRunner({
    evolutionInterval: 60000, // 1分钟（演示用）
    publishToEvoMap: false, // 暂时不发布
  });

  runner.start();

  // 处理退出信号
  process.on('SIGINT', () => runner.stop());
  process.on('SIGTERM', () => runner.stop());
}

module.exports = ContinuousEvolutionRunner;
