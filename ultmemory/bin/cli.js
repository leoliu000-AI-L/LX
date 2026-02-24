#!/usr/bin/env node
/**
 * UltMemory CLI 工具
 * 命令行界面
 */

import { UltMemory } from '../src/index.js';
import { PerformanceTester } from '../tests/performance-test.js';
import fs from 'fs/promises';
import path from 'path';

const CLI_VERSION = '0.1.0';

// 显示帮助
function showHelp() {
  console.log(`
UltMemory CLI v${CLI_VERSION}
用法: ultmemory <command> [options]

命令:
  init [dir]              初始化 UltMemory 系统 (默认目录: ./ultmemory-data)
  add <content>           添加记忆
  search <query>          检索记忆
  export [file]           导出记忆到文件
  import <file>           从文件导入记忆
  stats                   显示统计信息
  test                    运行性能测试
  stress [count]          运行压力测试 (默认: 100 条)
  memory                  运行内存测试
  clear                   清空所有数据
  help                    显示帮助信息

选项:
  --topK <number>         检索返回的最大结果数 (默认: 10)
  --minPhi <number>       最小意识水平 (0-1)
  --format <format>       导出格式 (json, text)
  --verbose               显示详细信息

示例:
  ultmemory init ./my-memory
  ultmemory add "我喜欢编程"
  ultmemory search "编程" --topK 5
  ultmemory export backup.json
  ultmemory import backup.json
  ultmemory stats
  ultmemory test
  ultmemory stress 1000
  ultmemory memory
  ultmemory clear

更多信息: https://github.com/your-repo/ultmemory
  `);
}

// 解析命令行参数
function parseArgs(args) {
  const parsed = {
    command: null,
    options: {},
    args: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // 选项
      const optionName = arg.slice(2);
      const optionValue = args[i + 1];

      if (optionValue && !optionValue.startsWith('--')) {
        parsed.options[optionName] = optionValue;
        i++; // 跳过下一个参数
      } else {
        parsed.options[optionName] = true;
      }
    } else {
      // 命令或参数
      if (!parsed.command) {
        parsed.command = arg;
      } else {
        parsed.args.push(arg);
      }
    }
  }

  return parsed;
}

// 初始化系统
async function cmdInit(args) {
  const dir = args[0] || './ultmemory-data';
  console.log(`初始化 UltMemory 系统...`);
  console.log(`数据目录: ${dir}`);

  const ult = new UltMemory({ dataDir: dir });
  await ult.initialize();

  const stats = ult.getStats();
  console.log(`✓ 初始化成功!`);
  console.log(`  版本: ${stats.version}`);
  console.log(`  存储层: ${stats.storage.L0.size}/${stats.storage.L0.maxSize} (L0)`);
  console.log(`         ${stats.storage.L1.size}/${stats.storage.L1.maxSize} (L1)`);

  await ult.close();
}

// 添加记忆
async function cmdAdd(ult, args, options) {
  const content = args[0];
  if (!content) {
    console.error('错误: 请提供要添加的记忆内容');
    process.exit(1);
  }

  const uri = await ult.addMemory(content, {
    type: options.type || 'general',
    category: options.category || 'memories'
  });

  console.log(`✓ 记忆已添加: ${uri}`);
}

// 检索记忆
async function cmdSearch(ult, args, options) {
  const query = args[0];
  if (!query) {
    console.error('错误: 请提供搜索查询');
    process.exit(1);
  }

  const results = await ult.retrieveMemory(query, {
    topK: parseInt(options.topK) || 10,
    minPhi: parseFloat(options.minPhi) || 0
  });

  console.log(`找到 ${results.length} 条结果:\n`);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    console.log(`${i + 1}. [相似度: ${(result.similarity * 100).toFixed(1)}%]`);
    console.log(`   ${result.content}`);

    if (options.verbose) {
      console.log(`   URI: ${result.uri}`);
      console.log(`   Phi: ${(result.phi || 0).toFixed(3)}`);
      console.log(`   类型: ${result.metadata?.type || 'N/A'}`);
    }

    console.log('');
  }

  if (results.length === 0) {
    console.log('未找到匹配的记忆');
  }
}

// 导出记忆
async function cmdExport(ult, args, options) {
  const file = args[0] || 'ultmemory-export.json';
  const format = options.format || 'json';

  console.log(`导出记忆到 ${file}...`);

  const data = await ult.exportMemories(format);
  await fs.writeFile(file, data, 'utf-8');

  console.log(`✓ 导出成功!`);
  console.log(`  文件: ${file}`);
  console.log(`  格式: ${format}`);
}

// 导入记忆
async function cmdImport(ult, args, options) {
  const file = args[0];
  if (!file) {
    console.error('错误: 请提供要导入的文件');
    process.exit(1);
  }

  console.log(`从 ${file} 导入记忆...`);

  const data = await fs.readFile(file, 'utf-8');
  const result = await ult.importMemories(data, {
    skipDuplicates: true,
    updateExisting: false
  });

  console.log(`✓ 导入完成!`);
  console.log(`  新增: ${result.imported.length}`);
  console.log(`  更新: ${result.updated.length}`);
  console.log(`  跳过: ${result.skipped.length}`);
}

// 显示统计信息
async function cmdStats(ult) {
  const stats = ult.getStats();

  console.log('UltMemory 统计信息:\n');

  console.log('版本:');
  console.log(`  版本号: ${stats.version}`);
  console.log(`  初始化: ${stats.initialized ? '是' : '否'}`);

  console.log('\n存储:');
  console.log(`  L0 (热数据): ${stats.storage.L0.size}/${stats.storage.L0.maxSize}`);
  console.log(`  L1 (温数据): ${stats.storage.L1.size}/${stats.storage.L1.maxSize}`);
  console.log(`  L0 命中: ${stats.storage.L0.hits} 次`);
  console.log(`  L1 命中: ${stats.storage.L1.hits} 次`);
  console.log(`  L2 命中: ${stats.storage.L2.hits} 次`);
  console.log(`  迁移次数: ${stats.storage.migrations}`);

  console.log('\n知识:');
  console.log(`  向量数: ${stats.knowledge.vectors}`);
  console.log(`  节点数: ${stats.knowledge.nodes}`);
  console.log(`  边数: ${stats.knowledge.edges}`);

  console.log('\n文件系统:');
  console.log(`  符号链接: ${stats.fileSystem.symlinks}`);
  console.log(`  挂载点: ${stats.fileSystem.mountPoints}`);
}

// 运行性能测试
async function cmdTest() {
  console.log('运行性能测试...\n');

  const tester = new PerformanceTester();
  await tester.runFullSuite();

  console.log('\n✓ 性能测试完成!');
}

// 运行压力测试
async function cmdStress(args) {
  const count = parseInt(args[0]) || 100;

  console.log(`运行压力测试 (${count} 条记忆)...\n`);

  const tester = new PerformanceTester();
  const result = await tester.runStressTest('./ultmemory-stress-test', count);

  console.log('\n✓ 压力测试完成!');
  console.log(`  添加时间: ${result.addTime.toFixed(2)}ms`);
  console.log(`  平均每条: ${result.avgAddTime.toFixed(2)}ms`);
  console.log(`  检索时间: ${result.searchTime.toFixed(2)}ms`);
}

// 运行内存测试
async function cmdMemory() {
  console.log('运行内存使用测试...\n');

  const tester = new PerformanceTester();
  const result = await tester.runMemoryTest('./ultmemory-memory-test');

  console.log('\n✓ 内存测试完成!');
  console.log(`  堆内存: ${result.heapUsed.toFixed(2)} MB`);
  console.log(`  添加时间: ${result.addTime.toFixed(2)}ms`);
  console.log(`  检索时间: ${result.searchTime.toFixed(2)}ms`);
}

// 清空数据
async function cmdClear(ult) {
  console.log('清空所有数据...');

  await ult.clear();

  console.log('✓ 数据已清空!');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (!parsed.command || parsed.command === 'help') {
    showHelp();
    process.exit(0);
  }

  try {
    // 需要初始化的命令
    const needsInit = ['add', 'search', 'export', 'import', 'stats', 'clear'];
    let ult = null;

    if (needsInit.includes(parsed.command)) {
      const dataDir = process.env.ULTMEMORY_DIR || './ultmemory-data';
      ult = new UltMemory({ dataDir });
      await ult.initialize();
    }

    // 执行命令
    switch (parsed.command) {
      case 'init':
        await cmdInit(parsed.args);
        break;

      case 'add':
        await cmdAdd(ult, parsed.args, parsed.options);
        break;

      case 'search':
        await cmdSearch(ult, parsed.args, parsed.options);
        break;

      case 'export':
        await cmdExport(ult, parsed.args, parsed.options);
        break;

      case 'import':
        await cmdImport(ult, parsed.args, parsed.options);
        break;

      case 'stats':
        await cmdStats(ult);
        break;

      case 'test':
        await cmdTest();
        break;

      case 'stress':
        await cmdStress(parsed.args);
        break;

      case 'memory':
        await cmdMemory();
        break;

      case 'clear':
        await cmdClear(ult);
        break;

      default:
        console.error(`错误: 未知命令 "${parsed.command}"`);
        console.log('运行 "ultmemory help" 查看帮助');
        process.exit(1);
    }

    // 关闭系统
    if (ult) {
      await ult.close();
    }

  } catch (error) {
    console.error('错误:', error.message);
    if (parsed.options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行
main();
