/**
 * UltMemory 性能测试工具
 * 用于测试系统的性能指标
 */

import { UltMemory } from '../src/index.js';

export class PerformanceTester {
  constructor(config = {}) {
    this.config = {
      ...config
    };
    this.results = [];
  }

  /**
   * 运行性能测试
   */
  async runTest(testName, testFunction) {
    console.log(`\n📊 测试: ${testName}`);

    // 预热
    await testFunction();

    // 运行测试
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFunction();
      const end = performance.now();
      times.push(end - start);
    }

    // 计算统计数据
    const avg = times.reduce((sum, t) => sum + t, 0) / iterations;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(iterations / 2)];

    const result = {
      name: testName,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      median: median.toFixed(2),
      iterations
    };

    this.results.push(result);

    console.log(`  平均: ${result.avg}ms`);
    console.log(`  最小: ${result.min}ms`);
    console.log(`  最大: ${result.max}ms`);
    console.log(`  中位数: ${result.median}ms`);

    return result;
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('  性能测试报告');
    console.log('='.repeat(70) + '\n');

    for (const result of this.results) {
      console.log(`${result.name}:`);
      console.log(`  平均: ${result.avg}ms`);
      console.log(`  范围: ${result.min}ms - ${result.max}ms`);
      console.log(`  中位数: ${result.median}ms`);
      console.log('');
    }

    // 总体统计
    const avgTime = this.results.reduce((sum, r) => sum + parseFloat(r.avg), 0) / this.results.length;
    console.log(`总体平均响应时间: ${avgTime.toFixed(2)}ms\n`);
  }

  /**
   * 运行完整的性能测试套件
   */
  async runFullSuite(dataDir = './ultmemory-perf-test') {
    console.log('\n' + '='.repeat(70));
    console.log('  UltMemory 性能测试套件');
    console.log('='.repeat(70));

    const ult = new UltMemory({ dataDir });
    await ult.initialize();

    // 测试 1: 添加记忆
    await this.runTest('添加单条记忆', async () => {
      await ult.addMemory('这是一条测试记忆，用于性能测试。', {
        type: 'test'
      });
    });

    // 测试 2: 检索记忆
    await ult.addMemory('JavaScript 是一种编程语言。', { type: 'test' });
    await this.runTest('检索记忆', async () => {
      await ult.retrieveMemory('JavaScript', { topK: 5 });
    });

    // 测试 3: 批量添加
    const memories = Array(10).fill(null).map((_, i) => ({
      content: `测试记忆 ${i}: 用于性能测试的内容。`,
      options: { type: 'test' }
    }));

    await this.runTest('批量添加 10 条记忆', async () => {
      await ult.addMemories(memories);
    });

    // 测试 4: 上下文压缩
    const uris = [];
    for (let i = 0; i < 10; i++) {
      const uri = await ult.addMemory(`测试记忆 ${i} 的内容。`, { type: 'test' });
      uris.push(uri);
    }

    await this.runTest('压缩 10 条记忆的上下文', async () => {
      await ult.compressContext(uris);
    });

    // 测试 5: 知识推理
    if (uris.length > 0) {
      await this.runTest('知识推理 (深度 2)', async () => {
        await ult.reason(uris[0], 2);
      });
    }

    // 测试 6: 导出数据
    await this.runTest('导出所有记忆', async () => {
      await ult.exportMemories('json');
    });

    // 测试 7: 统计信息
    await this.runTest('获取统计信息', async () => {
      ult.getStats();
    });

    // 生成报告
    this.generateReport();

    // 清理
    await ult.clear();
    await ult.close();

    return this.results;
  }

  /**
   * 压力测试
   */
  async runStressTest(dataDir = './ultmemory-stress-test', itemCount = 100) {
    console.log('\n' + '='.repeat(70));
    console.log(`  UltMemory 压力测试 (${itemCount} 条记忆)`);
    console.log('='.repeat(70) + '\n');

    const ult = new UltMemory({ dataDir });
    await ult.initialize();

    const startTime = performance.now();

    // 批量添加
    console.log(`📦 批量添加 ${itemCount} 条记忆...`);
    const memories = Array(itemCount).fill(null).map((_, i) => ({
      content: `测试记忆 ${i}: 包含一些测试内容用于压力测试，编号是 ${i}。`,
      options: { type: 'stress_test', category: 'test' }
    }));

    const addStart = performance.now();
    await ult.addMemories(memories);
    const addEnd = performance.now();

    console.log(`✓ 添加完成: ${(addEnd - addStart).toFixed(2)}ms`);
    console.log(`  平均每条: ${((addEnd - addStart) / itemCount).toFixed(2)}ms`);

    // 检索测试
    console.log(`\n🔍 检索测试...`);
    const searchStart = performance.now();
    const results = await ult.retrieveMemory('测试记忆', { topK: 10 });
    const searchEnd = performance.now();

    console.log(`✓ 检索完成: ${(searchEnd - searchStart).toFixed(2)}ms`);
    console.log(`  找到 ${results.length} 条结果`);

    // 获取统计
    const stats = ult.getStats();
    console.log(`\n📊 最终统计:`);
    console.log(`  总记忆数: ${stats.knowledge.vectors}`);
    console.log(`  L0 大小: ${stats.storage.L0.size}`);
    console.log(`  L1 大小: ${stats.storage.L1.size}`);
    console.log(`  迁移次数: ${stats.storage.migrations}`);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`\n⏱️  总耗时: ${totalTime.toFixed(2)}ms`);
    console.log(`   添加: ${(addEnd - addStart).toFixed(2)}ms (${((addEnd - addStart) / totalTime * 100).toFixed(1)}%)`);
    console.log(`   检索: ${(searchEnd - searchStart).toFixed(2)}ms (${((searchEnd - searchStart) / totalTime * 100).toFixed(1)}%)`);

    // 清理
    await ult.close();

    return {
      itemCount,
      addTime: addEnd - addStart,
      searchTime: searchEnd - searchStart,
      totalTime,
      avgAddTime: (addEnd - addStart) / itemCount
    };
  }

  /**
   * 内存使用测试
   */
  async runMemoryTest(dataDir = './ultmemory-memory-test') {
    console.log('\n' + '='.repeat(70));
    console.log('  UltMemory 内存使用测试');
    console.log('='.repeat(70) + '\n');

    const ult = new UltMemory({ dataDir });
    await ult.initialize();

    // 获取初始内存
    if (global.gc) {
      global.gc();
    }
    const initialMemory = process.memoryUsage();

    // 添加 1000 条记忆
    console.log('📦 添加 1000 条记忆...');
    const memories = Array(1000).fill(null).map((_, i) => ({
      content: `测试记忆 ${i}: 包含一些较长的测试内容用于内存测试。`.repeat(10),
      options: { type: 'memory_test' }
    }));

    const addStart = performance.now();
    await ult.addMemories(memories);
    const addEnd = performance.now();

    // 获取添加后的内存
    if (global.gc) {
      global.gc();
    }
    const afterAddMemory = process.memoryUsage();

    // 检索测试
    console.log('\n🔍 执行 100 次检索...');
    const searchStart = performance.now();
    for (let i = 0; i < 100; i++) {
      await ult.retrieveMemory(`测试记忆 ${i % 100}`, { topK: 5 });
    }
    const searchEnd = performance.now();

    // 获取最终内存
    if (global.gc) {
      global.gc();
    }
    const finalMemory = process.memoryUsage();

    // 计算内存使用
    const heapUsed = afterAddMemory.heapUsed - initialMemory.heapUsed;
    const heapTotal = afterAddMemory.heapTotal - initialMemory.heapTotal;
    const rss = afterAddMemory.rss - initialMemory.rss;

    console.log('\n📊 内存使用统计:');
    console.log(`  堆内存使用: ${(heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  堆内存总计: ${(heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS: ${(rss / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n⏱️  性能统计:');
    console.log(`  添加 1000 条: ${(addEnd - addStart).toFixed(2)}ms`);
    console.log(`  平均每条: ${((addEnd - addStart) / 1000).toFixed(2)}ms`);
    console.log(`  100 次检索: ${(searchEnd - searchStart).toFixed(2)}ms`);
    console.log(`  平均每次: ${((searchEnd - searchStart) / 100).toFixed(2)}ms`);

    // 清理
    await ult.close();

    return {
      heapUsed: heapUsed / 1024 / 1024,
      heapTotal: heapTotal / 1024 / 1024,
      rss: rss / 1024 / 1024,
      addTime: addEnd - addStart,
      searchTime: searchEnd - searchStart
    };
  }
}
