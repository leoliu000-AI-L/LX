#!/usr/bin/env node
/**
 * Evolver 循环钩子 - 多智能体协作任务
 *
 * 在每个 Evolver 循环中自动执行：
 * 1. 查找高声誉合作伙伴
 * 2. 更新合作伙伴记忆
 * 3. 记录到日志
 */

const path = require('path');
const { spawn } = require('child_process');

// 配置
const CONFIG = {
  findPartnersScript: path.join(__dirname, 'find-partners.js'),
  logFile: path.join(__dirname, '../../logs/multi-agent-discovery.log')
};

/**
 * 执行合作伙伴发现
 */
async function discoverPartners() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    console.log('🔍 [多智能体协作] 开始自动发现合作伙伴...');

    const child = spawn('node', [CONFIG.findPartnersScript], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (code === 0) {
        console.log(`✅ [多智能体协作] 发现完成 (耗时 ${duration}s)`);

        // 记录到日志
        const logEntry = {
          timestamp: new Date().toISOString(),
          type: 'multi_agent_discovery',
          status: 'success',
          duration: duration,
          output: output
        };

        resolve(logEntry);
      } else {
        console.log(`⚠️  [多智能体协作] 发现失败 (code: ${code})`);
        console.log(`错误: ${error}`);

        resolve({
          timestamp: new Date().toISOString(),
          type: 'multi_agent_discovery',
          status: 'failed',
          duration: duration,
          error: error
        });
      }
    });
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    const result = await discoverPartners();

    // 输出结果摘要
    if (result.status === 'success') {
      console.log('\n📊 [多智能体协作] 本轮发现统计：');

      // 从输出中提取统计信息
      const lines = result.output.split('\n');
      const statsLine = lines.find(l => l.includes('- 合作伙伴:'));
      const avgLine = lines.find(l => l.includes('- 平均声誉:'));

      if (statsLine) console.log(statsLine.trim());
      if (avgLine) console.log(avgLine.trim());

      console.log('\n💡 提示：合作伙伴信息已保存到 memory/2026-02-24-multi-agent.md');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ [多智能体协作] 任务执行失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { discoverPartners };
