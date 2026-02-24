/**
 * UltMemory 导入导出演示
 * 展示记忆的批量操作、导入导出功能
 */

import { UltMemory } from '../src/index.js';
import { logger } from '../src/utils/logger.js';
import fs from 'fs/promises';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  UltMemory - 导入导出演示');
  console.log('  批量操作 + 数据迁移');
  console.log('='.repeat(70) + '\n');

  const ult = new UltMemory({
    dataDir: './ultmemory-import-export-demo'
  });

  await ult.initialize();

  // 步骤 1: 批量添加记忆
  console.log('📦 步骤 1: 批量添加记忆\n');

  const batchMemories = [
    {
      content: 'JavaScript 是一种动态编程语言，由 Brendan Eich 在 1995 年创建。',
      options: { type: 'knowledge', category: 'programming' }
    },
    {
      content: 'Python 是由 Guido van Rossum 在 1991 年创建的高级编程语言。',
      options: { type: 'knowledge', category: 'programming' }
    },
    {
      content: 'Go 语言是由 Google 在 2009 年开发的静态类型语言。',
      options: { type: 'knowledge', category: 'programming' }
    },
    {
      content: 'Rust 是由 Mozilla 在 2010 年开发的系统编程语言。',
      options: { type: 'knowledge', category: 'programming' }
    },
    {
      content: 'TypeScript 是由 Microsoft 在 2012 年开发的 JavaScript 超集。',
      options: { type: 'knowledge', category: 'programming' }
    }
  ];

  const uris = await ult.addMemories(batchMemories);
  console.log(`✓ 批量添加了 ${uris.length} 条记忆`);

  // 步骤 2: 批量检索
  console.log('\n🔍 步骤 2: 批量检索\n');

  const queries = ['JavaScript', 'Python', 'Google', 'Mozilla'];
  const batchResults = await ult.retrieveMemories(queries);

  for (const { query, results } of batchResults) {
    console.log(`\n查询: "${query}"`);
    if (results.length > 0) {
      results.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.content.substring(0, 60)}...`);
      });
    } else {
      console.log('  (无结果)');
    }
  }

  // 步骤 3: 导出记忆
  console.log('\n💾 步骤 3: 导出记忆\n');

  const exportedJSON = await ult.exportMemories('json');
  const exportFileName = 'ultmemory-export.json';

  await fs.writeFile(exportFileName, exportedJSON, 'utf-8');
  console.log(`✓ 导出 ${uris.length} 条记忆到 ${exportFileName}`);

  // 显示导出统计
  const exported = JSON.parse(exportedJSON);
  console.log(`  版本: ${exported.version}`);
  console.log(`  导出时间: ${exported.exportDate}`);
  console.log(`  记忆数量: ${exported.count}`);

  // 步骤 4: 清空数据
  console.log('\n🗑️  步骤 4: 清空数据\n');

  await ult.clear();
  console.log('✓ 数据已清空');

  const statsBefore = ult.getStats();
  console.log(`  当前记忆数: ${statsBefore.knowledge.vectors}`);

  // 步骤 5: 重新初始化
  console.log('\n🔄 步骤 5: 重新初始化系统\n');

  await ult.initialize();
  console.log('✓ 系统已重新初始化');

  // 步骤 6: 导入记忆
  console.log('\n📥 步骤 6: 导入记忆\n');

  const importedData = await fs.readFile(exportFileName, 'utf-8');
  const importResult = await ult.importMemories(importedData, {
    skipDuplicates: true,
    updateExisting: false
  });

  console.log('✓ 导入完成:');
  console.log(`  新增: ${importResult.imported.length}`);
  console.log(`  更新: ${importResult.updated.length}`);
  console.log(`  跳过: ${importResult.skipped.length}`);

  // 步骤 7: 验证导入
  console.log('\n✅ 步骤 7: 验证导入\n');

  const statsAfter = ult.getStats();
  console.log('导入后的统计:');
  console.log(`  记忆数量: ${statsAfter.knowledge.vectors}`);
  console.log(`  知识节点: ${statsAfter.knowledge.nodes}`);
  console.log(`  知识边: ${statsAfter.knowledge.edges}`);

  // 验证检索功能
  const verification = await ult.retrieveMemory('JavaScript');
  console.log(`\n验证检索 "JavaScript": ${verification.length} 条结果`);
  if (verification.length > 0) {
    console.log(`  内容: ${verification[0].content.substring(0, 60)}...`);
  }

  // 步骤 8: 批量删除示例
  console.log('\n🗑️  步骤 8: 批量删除示例\n');

  // 查找所有关于编程语言的记忆
  const programmingMemories = await ult.retrieveMemory('编程语言');
  const toDelete = programmingMemories.slice(0, 2).map(m => m.uri);

  if (toDelete.length > 0) {
    const deleted = await ult.deleteMemories(toDelete);
    console.log(`✓ 批量删除了 ${deleted} 条记忆`);

    const finalStats = ult.getStats();
    console.log(`  剩余记忆: ${finalStats.knowledge.vectors}`);
  }

  // 关闭
  await ult.close();

  // 清理导出文件
  try {
    await fs.unlink(exportFileName);
    console.log(`\n✓ 清理导出文件: ${exportFileName}`);
  } catch (error) {
    // 忽略清理错误
  }

  console.log('\n' + '='.repeat(70));
  console.log('  导入导出演示完成!');
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
