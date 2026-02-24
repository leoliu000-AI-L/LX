/**
 * UltMemory 基础测试
 */

import { UltMemory } from '../src/index.js';
import { logger } from '../src/utils/logger.js';

async function runTests() {
  logger.info('开始 UltMemory 基础测试...\n');

  const tests = [];

  // 测试 1: 初始化
  tests.push({
    name: '测试 1: 初始化 UltMemory',
    run: async () => {
      const ult = new UltMemory({
        dataDir: './ultmemory-test-data'
      });

      await ult.initialize();

      const stats = ult.getStats();
      console.log('✓ 初始化成功');
      console.log('  版本:', stats.version);
      console.log('  L0 大小:', stats.storage.L0.size);
      console.log('  L1 大小:', stats.storage.L1.size);
      console.log('  向量数:', stats.knowledge.vectors);

      await ult.close();
      return true;
    }
  });

  // 测试 2: 添加记忆
  tests.push({
    name: '测试 2: 添加记忆',
    run: async () => {
      const ult = new UltMemory({
        dataDir: './ultmemory-test-data'
      });

      await ult.initialize();

      // 添加多条记忆
      const uri1 = await ult.addMemory('我喜欢编程,特别是 JavaScript 和 Python。', {
        type: 'preference',
        category: 'memories'
      });

      const uri2 = await ult.addMemory('我在学习人工智能和机器学习。', {
        type: 'knowledge',
        category: 'memories'
      });

      const uri3 = await ult.addMemory('我的名字是 Leo,是一名软件工程师。', {
        type: 'identity',
        category: 'memories'
      });

      console.log('✓ 添加了 3 条记忆:');
      console.log('  ', uri1);
      console.log('  ', uri2);
      console.log('  ', uri3);

      await ult.close();
      return true;
    }
  });

  // 测试 3: 检索记忆
  tests.push({
    name: '测试 3: 检索记忆',
    run: async () => {
      const ult = new UltMemory({
        dataDir: './ultmemory-test-data'
      });

      await ult.initialize();

      // 检索关于编程的记忆
      const results1 = await ult.retrieveMemory('编程');
      console.log('✓ 检索"编程":', results1.length, '条结果');

      // 检索关于 AI 的记忆
      const results2 = await ult.retrieveMemory('人工智能');
      console.log('✓ 检索"人工智能":', results2.length, '条结果');

      // 检索关于 Leo 的记忆
      const results3 = await ult.retrieveMemory('Leo');
      console.log('✓ 检索"Leo":', results3.length, '条结果');

      await ult.close();
      return true;
    }
  });

  // 测试 4: 更新记忆
  tests.push({
    name: '测试 4: 更新记忆',
    run: async () => {
      const ult = new UltMemory({
        dataDir: './ultmemory-test-data'
      });

      await ult.initialize();

      // 先添加一条记忆
      const uri = await ult.addMemory('我喜欢咖啡。', {
        type: 'preference'
      });

      // 更新记忆
      await ult.updateMemory(uri, '我喜欢拿铁咖啡和卡布奇诺。');

      // 验证更新
      const updated = await ult.getMemory(uri);
      console.log('✓ 更新记忆:');
      console.log('  原: 我喜欢咖啡。');
      console.log('  新:', updated.content);

      await ult.close();
      return true;
    }
  });

  // 测试 5: 删除记忆
  tests.push({
    name: '测试 5: 删除记忆',
    run: async () => {
      const ult = new UltMemory({
        dataDir: './ultmemory-test-data'
      });

      await ult.initialize();

      // 添加一条记忆
      const uri = await ult.addMemory('这是一条临时记忆。', {
        type: 'temporary'
      });

      // 删除记忆
      await ult.deleteMemory(uri);

      // 验证删除
      const deleted = await ult.getMemory(uri);
      console.log('✓ 删除记忆:', deleted === null ? '成功' : '失败');

      await ult.close();
      return true;
    }
  });

  // 测试 6: 上下文压缩
  tests.push({
    name: '测试 6: 上下文压缩',
    run: async () => {
      const ult = new UltMemory({
        dataDir: './ultmemory-test-data'
      });

      await ult.initialize();

      // 添加多条记忆
      const uri1 = await ult.addMemory('JavaScript 是一种动态编程语言。');
      const uri2 = await ult.addMemory('Python 是一种高级编程语言。');
      const uri3 = await ult.addMemory('Rust 是一种系统编程语言。');

      // 压缩上下文
      const compressed = await ult.compressContext([uri1, uri2, uri3]);

      console.log('✓ 上下文压缩:');
      console.log('  原始大小:', compressed.originalSize, '字节');
      console.log('  压缩后:', compressed.compressedSize, '字节');
      console.log('  压缩比:', (compressed.compressionRatio * 100).toFixed(2), '%');
      console.log('  摘要:\n', compressed.summary);

      await ult.close();
      return true;
    }
  });

  // 测试 7: 系统信息
  tests.push({
    name: '测试 7: 系统信息',
    run: async () => {
      const ult = new UltMemory();
      const info = ult.getSystemInfo();

      console.log('✓ 系统信息:');
      console.log('  名称:', info.name);
      console.log('  版本:', info.version);
      console.log('  描述:', info.description);
      console.log('  特性数:', info.features.length);
      console.log('  架构层数:', Object.keys(info.architecture).length);

      return true;
    }
  });

  // 运行所有测试
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n${test.name}`);
      await test.run();
      passed++;
      console.log('✓ 测试通过');
    } catch (error) {
      failed++;
      console.error('✗ 测试失败:', error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(50));

  return failed === 0;
}

// 运行测试
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
