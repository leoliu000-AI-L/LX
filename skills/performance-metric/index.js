const fs = require('fs/promises');
const path = require('path');
const { glob } = require('glob');

const LOGS_DIR = '/root/.openclaw/workspace/logs';

async function generate(options = {}) {
  const {
    cycles = 20,
    verbose = false,
    dryRun = false
  } = options;

  if (dryRun) {
    return {
      dryRun: true,
      message: `Would analyze last ${cycles} evolver cycles from ${LOGS_DIR}`
    };
  }

  // Find status files
  const statusFiles = await glob('status_*.json', {
    cwd: LOGS_DIR,
    nodir: true,
    sort: 'desc'
  });

  const recentFiles = statusFiles.slice(0, cycles);
  const cyclesData = [];

  for (const file of recentFiles) {
    try {
      const content = await fs.readFile(path.join(LOGS_DIR, file), 'utf8');
      const data = JSON.parse(content);
      const cycleMatch = file.match(/status_(\d+)\.json/);
      const cycleNumber = cycleMatch ? parseInt(cycleMatch[1]) : null;
      
      cyclesData.push({
        cycle: cycleNumber,
        file,
        ...data
      });
    } catch (e) {
      // Skip invalid files
    }
  }

  // Calculate metrics
  const metrics = {
    totalCycles: cyclesData.length,
    successRate: 0,
    successCount: 0,
    failureCount: 0,
    byIntent: {
      INNOVATION: 0,
      REPAIR: 0,
      OPTIMIZE: 0,
      创新: 0,
      修复: 0,
      优化: 0
    },
    recentCycles: cyclesData.sort((a, b) => b.cycle - a.cycle).slice(0, 10)
  };

  cyclesData.forEach(cycle => {
    if (cycle.result === 'success') {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    // Parse intent from en field
    const intentMatch = cycle.en.match(/\[(\w+)\]/);
    if (intentMatch) {
      const intent = intentMatch[1].toUpperCase();
      if (metrics.byIntent.hasOwnProperty(intent)) {
        metrics.byIntent[intent]++;
      }
    }

    // Parse Chinese intent
    const zhIntentMatch = cycle.zh.match(/\[(\w+)\]/);
    if (zhIntentMatch) {
      const intent = zhIntentMatch[1];
      if (metrics.byIntent.hasOwnProperty(intent)) {
        metrics.byIntent[intent]++;
      }
    }
  });

  metrics.successRate = metrics.totalCycles > 0 
    ? Math.round((metrics.successCount / metrics.totalCycles) * 100) 
    : 0;

  // Normalize intents (merge Chinese and English)
  metrics.normalizedIntents = {
    innovation: metrics.byIntent.INNOVATION + metrics.byIntent.创新,
    repair: metrics.byIntent.REPAIR + metrics.byIntent.修复,
    optimize: metrics.byIntent.OPTIMIZE + metrics.byIntent.优化
  };

  // Calculate dominant intent
  metrics.dominantIntent = Object.entries(metrics.normalizedIntents)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Generate dashboard
  const progressBar = (percent, length = 20) => {
    const filled = Math.round((percent / 100) * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
  };

  metrics.dashboard = [
    `🧬 Evolver Performance Dashboard`,
    ``,
    `Last ${metrics.totalCycles} cycles:`,
    `✅ Success rate: ${metrics.successRate}% ${progressBar(metrics.successRate)}`,
    `   Success: ${metrics.successCount} | Failed: ${metrics.failureCount}`,
    ``,
    `Intent distribution:`,
    `🚀 Innovation: ${metrics.normalizedIntents.innovation} (${Math.round(metrics.normalizedIntents.innovation / metrics.totalCycles * 100)}%) ${progressBar(metrics.normalizedIntents.innovation / metrics.totalCycles * 100)}`,
    `🔧 Repair: ${metrics.normalizedIntents.repair} (${Math.round(metrics.normalizedIntents.repair / metrics.totalCycles * 100)}%) ${progressBar(metrics.normalizedIntents.repair / metrics.totalCycles * 100)}`,
    `⚡ Optimize: ${metrics.normalizedIntents.optimize} (${Math.round(metrics.normalizedIntents.optimize / metrics.totalCycles * 100)}%) ${progressBar(metrics.normalizedIntents.optimize / metrics.totalCycles * 100)}`,
    ``,
    `Dominant intent: ${metrics.dominantIntent.charAt(0).toUpperCase() + metrics.dominantIntent.slice(1)}`,
    ``,
    `Recent cycles:`,
    ...metrics.recentCycles.map(cycle => {
      const statusIcon = cycle.result === 'success' ? '✅' : '❌';
      const intent = cycle.en.match(/\[(\w+)\]/)?.[1] || 'UNKNOWN';
      return `  ${statusIcon} #${cycle.cycle}: ${intent} - ${cycle.en.replace(/\[(\w+)\]\s*/, '')}`;
    })
  ].join('\n');

  return metrics;
}

// CLI entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const cycles = args.includes('--cycles') ? parseInt(args[args.indexOf('--cycles') + 1]) : 20;
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');
  const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;

  generate({ cycles, verbose, dryRun })
    .then(async metrics => {
      console.log(metrics.dashboard || metrics.message);
      
      if (outputFile) {
        await fs.writeFile(outputFile, JSON.stringify(metrics, null, 2));
        console.log(`\n💾 Full report saved to: ${outputFile}`);
      }

      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error generating performance report:', err.message);
      process.exit(1);
    });
}

module.exports = { generate };
