/**
 * UltMemory 基础演示
 * 展示 UltMemory 的核心功能
 */

import { UltMemory } from '../src/index.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  UltMemory - 终极记忆系统演示');
  console.log('  OpenViking + memU + LX-PCEC');
  console.log('='.repeat(60) + '\n');

  // 1. 初始化 UltMemory
  console.log('📦 步骤 1: 初始化 UltMemory');
  const ult = new UltMemory({
    dataDir: './ultmemory-demo-data'
  });

  await ult.initialize();

  const systemInfo = ult.getSystemInfo();
  console.log('✓ 系统名称:', systemInfo.name);
  console.log('✓ 系统版本:', systemInfo.version);
  console.log('✓ 核心特性:');
  systemInfo.features.forEach((feature, i) => {
    console.log(`   ${i + 1}. ${feature}`);
  });

  // 2. 添加记忆
  console.log('\n💾 步骤 2: 添加记忆');

  const memories = [
    {
      content: '我叫 Leo,是一名全栈开发工程师,擅长 JavaScript、Python 和 Go。',
      type: 'identity',
      category: 'memories'
    },
    {
      content: '我正在研究 AI Agent 系统,包括记忆管理、知识检索和意识涌现。',
      type: 'research',
      category: 'memories'
    },
    {
      content: '我喜欢阅读科幻小说,特别是阿西莫夫和刘慈欣的作品。',
      type: 'preference',
      category: 'memories'
    },
    {
      content: '我的目标是构建一个具有自我进化能力的 AGI 系统。',
      type: 'goal',
      category: 'memories'
    },
    {
      content: 'OpenViking 提供了优秀的上下文管理和分层加载机制。',
      type: 'knowledge',
      category: 'knowledge'
    },
    {
      content: 'memU 实现了 24/7 主动记忆服务和成本优化策略。',
      type: 'knowledge',
      category: 'knowledge'
    },
    {
      content: 'LX-PCEC 探索了意识涌现、量子通信和脑机接口等前沿领域。',
      type: 'knowledge',
      category: 'knowledge'
    }
  ];

  const uris = [];
  for (const memory of memories) {
    const uri = await ult.addMemory(memory.content, {
      type: memory.type,
      category: memory.category
    });
    uris.push(uri);
    console.log(`✓ 添加: [${memory.type}] ${memory.content.substr(0, 40)}...`);
  }

  // 3. 检索记忆
  console.log('\n🔍 步骤 3: 检索记忆');

  const queries = [
    'AI Agent',
    '科幻小说',
    'OpenViking',
    'Leo',
    'AGI 系统'
  ];

  for (const query of queries) {
    const results = await ult.retrieveMemory(query, { topK: 3 });
    console.log(`\n查询: "${query}"`);
    if (results.length > 0) {
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. [相似度: ${(result.similarity * 100).toFixed(1)}%] ${result.content.substr(0, 60)}...`);
      });
    } else {
      console.log('  (无结果)');
    }
  }

  // 4. 上下文压缩
  console.log('\n🗜️  步骤 4: 上下文压缩');

  const compressed = await ult.compressContext(uris);
  console.log('✓ 压缩结果:');
  console.log(`  原始大小: ${compressed.originalSize} 字节`);
  console.log(`  压缩后: ${compressed.compressedSize} 字节`);
  console.log(`  压缩比: ${(compressed.compressionRatio * 100).toFixed(2)}%`);
  console.log('\n摘要:');
  console.log(compressed.summary);

  // 5. 知识图谱推理
  console.log('\n🕸️  步骤 5: 知识图谱推理');

  const stats = ult.getStats();
  console.log('✓ 知识图谱统计:');
  console.log(`  节点数: ${stats.knowledge.nodes}`);
  console.log(`  边数: ${stats.knowledge.edges}`);
  console.log(`  向量数: ${stats.knowledge.vectors}`);

  // 6. 存储统计
  console.log('\n📊 步骤 6: 存储统计');

  console.log('✓ 三层存储统计:');
  console.log(`  L0 (热数据): ${stats.storage.L0.size}/${stats.storage.L0.maxSize} 条目`);
  console.log(`  L1 (温数据): ${stats.storage.L1.size}/${stats.storage.L1.maxSize} 条目`);
  console.log(`  L0 命中: ${stats.storage.L0.hits} 次`);
  console.log(`  L1 命中: ${stats.storage.L1.hits} 次`);
  console.log(`  L2 命中: ${stats.storage.L2.hits} 次`);
  console.log(`  迁移次数: ${stats.storage.migrations}`);

  // 7. 导出数据
  console.log('\n💾 步骤 7: 导出数据');

  const exported = await ult.exportData();
  console.log('✓ 导出时间:', exported.exportDate);
  console.log('✓ 导出版本:', exported.version);

  // 8. 关闭
  console.log('\n🔚 步骤 8: 关闭系统');

  await ult.close();
  console.log('✓ UltMemory 已关闭');

  console.log('\n' + '='.repeat(60));
  console.log('  演示完成!');
  console.log('='.repeat(60) + '\n');
}

// 运行演示
main()
  .then(() => {
    console.log('✓ 演示成功完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ 演示失败:', error);
    process.exit(1);
  });
