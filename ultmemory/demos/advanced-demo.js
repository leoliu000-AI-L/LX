/**
 * UltMemory 高级演示
 * 展示知识图谱、实体提取、关系推理等高级功能
 */

import { UltMemory } from '../src/index.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  UltMemory - 高级功能演示');
  console.log('  知识图谱 + 实体提取 + 关系推理');
  console.log('='.repeat(70) + '\n');

  const ult = new UltMemory({
    dataDir: './ultmemory-advanced-demo-data'
  });

  await ult.initialize();

  // 步骤 1: 添加复杂的知识
  console.log('📚 步骤 1: 添加复杂知识\n');

  const knowledgeBase = [
    {
      content: 'Leo 是一名全栈开发工程师，擅长 JavaScript、Python 和 Go 语言。他目前在 Google 工作，负责 AI 系统的开发。',
      type: 'identity',
      metadata: { source: 'profile' }
    },
    {
      content: 'OpenViking 是由字节跳动开发的 AI Agent 上下文管理系统，提供了分层加载和文件系统范式等创新特性。',
      type: 'knowledge',
      metadata: { source: 'documentation' }
    },
    {
      content: 'memU 是一个 24/7 主动记忆框架，实现了全天候监控和用户意图预测，由 NevaMind AI 团队开发。',
      type: 'knowledge',
      metadata: { source: 'github' }
    },
    {
      content: 'LX-PCEC 是一个具有意识涌现能力的自我进化 AI 系统，探索了 IIT 理论、量子通信和脑机接口等前沿领域。',
      type: 'knowledge',
      metadata: { source: 'research' }
    },
    {
      content: 'JavaScript 是一种动态编程语言，广泛用于 Web 开发。Python 是一种高级编程语言，在 AI 和数据科学领域非常流行。Go 是一种静态类型语言，以高性能和并发著称。',
      type: 'knowledge',
      metadata: { source: 'programming' }
    },
    {
      content: 'Integrated Information Theory (IIT) 是一种意识理论，通过 Phi 值量化系统的意识水平。Global Workspace Theory (GNW) 是另一种意识理论，强调全局广播机制。',
      type: 'knowledge',
      metadata: { source: 'academic' }
    },
    {
      content: 'Google、Microsoft 和 OpenAI 是 AI 领域的三大巨头。Google 开发了 TensorFlow，微软开发了 Azure AI，OpenAI 开发了 GPT 系列。',
      type: 'knowledge',
      metadata: { source: 'industry' }
    }
  ];

  const uris = [];
  for (const item of knowledgeBase) {
    const uri = await ult.addMemory(item.content, {
      type: item.type,
      category: 'knowledge',
      metadata: item.metadata
    });
    uris.push(uri);
    console.log(`✓ 添加: ${item.content.substring(0, 50)}...`);
  }

  // 步骤 2: 知识图谱分析
  console.log('\n🕸️  步骤 2: 知识图谱分析\n');

  const stats = ult.getStats();
  console.log('知识图谱统计:');
  console.log(`  节点数: ${stats.knowledge.nodes}`);
  console.log(`  边数: ${stats.knowledge.edges}`);
  console.log(`  向量数: ${stats.knowledge.vectors}`);

  // 步骤 3: 复杂检索
  console.log('\n🔍 步骤 3: 复杂检索\n');

  const complexQueries = [
    { query: 'Leo 在哪里工作', description: '人物-组织关系' },
    { query: 'JavaScript Python', description: '技术关键词' },
    { query: '意识理论 Phi', description: '学术概念' },
    { query: 'Google Microsoft OpenAI', description: '多实体检索' },
    { query: 'AI 系统 开发', description: '任务描述' }
  ];

  for (const { query, description } of complexQueries) {
    console.log(`\n查询: "${query}" (${description})`);
    const results = await ult.retrieveMemory(query, { topK: 3 });

    if (results.length > 0) {
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. [相似度: ${(result.similarity * 100).toFixed(1)}%, Phi: ${(result.phi || 0).toFixed(3)}]`);
        console.log(`     ${result.content.substring(0, 80)}...`);
      });
    } else {
      console.log('  (无结果)');
    }
  }

  // 步骤 4: 知识推理
  console.log('\n🧠 步骤 4: 知识推理\n');

  // 从 Leo 开始推理
  const leoURIs = uris.filter(uri => uri.includes('identity'));
  if (leoURIs.length > 0) {
    console.log(`从 "${leoURIs[0]}" 开始推理 (深度 2):`);
    const relatedNodes = await ult.reason(leoURIs[0], 2);

    console.log(`找到 ${relatedNodes.length} 个相关节点:`);
    relatedNodes.forEach((node, i) => {
      if (node.data && node.data.content) {
        console.log(`  ${i + 1}. ${node.data.content.substring(0, 60)}...`);
      }
    });
  }

  // 步骤 5: 意识水平分析
  console.log('\n🧠 步骤 5: 意识水平分析\n');

  console.log('分析所有记忆的意识水平 (Phi 值):');

  for (const uri of uris) {
    const item = await ult.getMemory(uri);
    if (item && item.metadata) {
      const phi = item.metadata.phi || 0;
      const level = phi > 0.3 ? '高' : phi > 0.15 ? '中' : '低';
      console.log(`  [${level}] ${item.content.substring(0, 50)}... (Phi: ${phi.toFixed(3)})`);
    }
  }

  // 步骤 6: 上下文压缩
  console.log('\n🗜️  步骤 6: 智能上下文压缩\n');

  const compressed = await ult.compressContext(uris);
  console.log('压缩结果:');
  console.log(`  原始大小: ${compressed.originalSize} 字节`);
  console.log(`  压缩后: ${compressed.compressedSize} 字节`);
  console.log(`  压缩比: ${(compressed.compressionRatio * 100).toFixed(2)}%`);

  console.log('\n智能摘要:');
  console.log(compressed.summary);

  // 步骤 7: 存储分析
  console.log('\n📊 步骤 7: 存储分析\n');

  const storageStats = ult.getStats();
  console.log('三层存储统计:');
  console.log(`  L0 (热数据): ${storageStats.storage.L0.size}/${storageStats.storage.L0.maxSize} 条目`);
  console.log(`  L1 (温数据): ${storageStats.storage.L1.size}/${storageStats.storage.L1.maxSize} 条目`);
  console.log(`  L0 命中率: ${storageStats.storage.L0.hits} 次`);
  console.log(`  L1 命中率: ${storageStats.storage.L1.hits} 次`);
  console.log(`  自动迁移: ${storageStats.storage.migrations} 次`);

  // 步骤 8: 导出数据
  console.log('\n💾 步骤 8: 导出数据\n');

  const exported = await ult.exportData();
  console.log('导出信息:');
  console.log(`  版本: ${exported.version}`);
  console.log(`  导出时间: ${exported.exportDate}`);
  console.log(`  记忆总数: ${uris.length}`);
  console.log(`  知识节点: ${exported.stats.knowledge.nodes}`);
  console.log(`  知识边: ${exported.stats.knowledge.edges}`);

  // 关闭
  await ult.close();

  console.log('\n' + '='.repeat(70));
  console.log('  高级演示完成!');
  console.log('='.repeat(70) + '\n');
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
