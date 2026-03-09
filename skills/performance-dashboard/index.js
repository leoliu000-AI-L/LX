#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Get evolution metrics from GEP assets
 * @returns {Object} Evolution metrics
 */
async function getEvolutionMetrics() {
  const metrics = {
    cycles: { total: 0, success: 0, failed: 0, successRate: 0 },
    genes: { total: 0, used: {}, topGenes: [] },
    capsules: { total: 0, successStreak: 0, avgConfidence: 0 },
    recentCycles: []
  };

  try {
    // Read events.jsonl for cycle data
    const eventsPath = path.resolve(__dirname, '../../assets/gep/events.jsonl');
    if (fs.existsSync(eventsPath)) {
      const events = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(line => line.trim());
      
      events.forEach(line => {
        try {
          const event = JSON.parse(line);
          if (event.type === 'EvolutionEvent') {
            metrics.cycles.total++;
            if (event.outcome?.status === 'success') {
              metrics.cycles.success++;
            } else {
              metrics.cycles.failed++;
            }

            // Track gene usage
            if (event.genes_used && Array.isArray(event.genes_used)) {
              event.genes_used.forEach(geneId => {
                metrics.genes.used[geneId] = (metrics.genes.used[geneId] || 0) + 1;
              });
            }

            // Add to recent cycles (last 20)
            metrics.recentCycles.push({
              id: event.id,
              intent: event.intent,
              status: event.outcome?.status || 'unknown',
              score: event.outcome?.score || 0,
              genes: event.genes_used || [],
              timestamp: event.meta?.at || event.created_at
            });
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      });

      // Calculate success rate
      if (metrics.cycles.total > 0) {
        metrics.cycles.successRate = Math.round((metrics.cycles.success / metrics.cycles.total) * 100);
      }

      // Sort recent cycles
      metrics.recentCycles = metrics.recentCycles.slice(-20).reverse();
    }

    // Read genes.json
    const genesPath = path.resolve(__dirname, '../../assets/gep/genes.json');
    if (fs.existsSync(genesPath)) {
      const genesData = JSON.parse(fs.readFileSync(genesPath, 'utf8'));
      metrics.genes.total = genesData.genes?.length || 0;

      // Get top genes by usage
      metrics.genes.topGenes = Object.entries(metrics.genes.used)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));
    }

    // Read capsules.json
    const capsulesPath = path.resolve(__dirname, '../../assets/gep/capsules.json');
    if (fs.existsSync(capsulesPath)) {
      const capsulesData = JSON.parse(fs.readFileSync(capsulesPath, 'utf8'));
      metrics.capsules.total = capsulesData.capsules?.length || 0;

      // Calculate average confidence and max success streak
      let totalConfidence = 0;
      let currentStreak = 0;
      capsulesData.capsules?.forEach(capsule => {
        if (capsule.confidence) totalConfidence += capsule.confidence;
        if (capsule.outcome?.status === 'success') {
          currentStreak++;
          metrics.capsules.successStreak = Math.max(metrics.capsules.successStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      if (metrics.capsules.total > 0) {
        metrics.capsules.avgConfidence = Math.round((totalConfidence / metrics.capsules.total) * 100) / 100;
      }
    }
  } catch (e) {
    console.error('Error reading evolution metrics:', e.message);
  }

  return metrics;
}

/**
 * Get system health metrics
 * @returns {Object} System metrics
 */
function getSystemMetrics() {
  const loadAvg = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);

  // Get disk usage
  let diskUsage = 'N/A';
  try {
    diskUsage = execSync('df -h / | tail -1 | awk \'{print $5}\'', { encoding: 'utf8' }).trim();
  } catch (e) {}

  // Get process count
  let processCount = 'N/A';
  try {
    processCount = execSync('ps aux | wc -l', { encoding: 'utf8' }).trim();
  } catch (e) {}

  return {
    uptime: Math.round(os.uptime() / 3600) + 'h',
    loadAvg: {
      '1m': loadAvg[0].toFixed(2),
      '5m': loadAvg[1].toFixed(2),
      '15m': loadAvg[2].toFixed(2)
    },
    memory: {
      total: Math.round(totalMem / 1024 / 1024 / 1024) + 'GB',
      used: Math.round(usedMem / 1024 / 1024 / 1024) + 'GB',
      free: Math.round(freeMem / 1024 / 1024 / 1024) + 'GB',
      usagePercent: memUsagePercent + '%'
    },
    diskUsage,
    processCount,
    nodeVersion: process.version,
    platform: os.platform()
  };
}

/**
 * Get all metrics (evolution + system)
 * @returns {Object} Combined metrics
 */
async function getMetrics() {
  const evolution = await getEvolutionMetrics();
  const system = getSystemMetrics();
  return { evolution, system, generatedAt: new Date().toISOString() };
}

/**
 * Print metrics in human-readable dashboard format
 * @param {Object} metrics - Metrics from getMetrics()
 */
function print(metrics) {
  console.log('📊 Evolution Performance Dashboard');
  console.log('==================================');
  console.log(`Generated at: ${metrics.generatedAt}\n`);

  // Evolution Summary
  console.log('🧬 Evolution Summary');
  console.log('-------------------');
  console.log(`Total Cycles: ${metrics.evolution.cycles.total}`);
  console.log(`Success Rate: ${metrics.evolution.cycles.successRate}% (${metrics.evolution.cycles.success} ✅ / ${metrics.evolution.cycles.failed} ❌)`);
  console.log(`Total Genes: ${metrics.evolution.genes.total}`);
  console.log(`Total Capsules: ${metrics.evolution.capsules.total}`);
  console.log(`Longest Success Streak: ${metrics.evolution.capsules.successStreak}`);
  console.log(`Average Capsule Confidence: ${metrics.evolution.capsules.avgConfidence}`);
  
  // Intent breakdown
  const intentBreakdown = metrics.evolution.recentCycles.reduce((acc, cycle) => {
    acc[cycle.intent] = (acc[cycle.intent] || 0) + 1;
    return acc;
  }, {});
  if (Object.keys(intentBreakdown).length > 0) {
    console.log(`Intent Breakdown: ${Object.entries(intentBreakdown).map(([intent, count]) => `${intent}: ${count}`).join(', ')}\n`);
  }

  // Top Genes
  if (metrics.evolution.genes.topGenes.length > 0) {
    console.log('🏆 Top Used Genes');
    console.log('----------------');
    metrics.evolution.genes.topGenes.forEach((gene, index) => {
      console.log(`${index + 1}. ${gene.id}: ${gene.count} uses`);
    });
    console.log('');
  }

  // Recent Cycles
  if (metrics.evolution.recentCycles.length > 0) {
    console.log('⏱️  Recent Cycles (last 20)');
    console.log('------------------------');
    metrics.evolution.recentCycles.slice(0, 10).forEach(cycle => {
      const statusEmoji = cycle.status === 'success' ? '✅' : '❌';
      const intentEmoji = {
        innovate: '✨',
        repair: '🔧',
        optimize: '⚡'
      }[cycle.intent] || '•';
      console.log(`${statusEmoji} ${intentEmoji} ${cycle.intent.toUpperCase()} - Score: ${cycle.score} - Genes: ${cycle.genes.join(', ')}`);
    });
    console.log('');
  }

  // System Health
  console.log('💻 System Health');
  console.log('---------------');
  console.log(`Uptime: ${metrics.system.uptime}`);
  console.log(`Load Average: ${metrics.system.loadAvg['1m']} (1m) / ${metrics.system.loadAvg['5m']} (5m) / ${metrics.system.loadAvg['15m']} (15m)`);
  console.log(`Memory Usage: ${metrics.system.memory.usagePercent} (${metrics.system.memory.used} / ${metrics.system.memory.total})`);
  console.log(`Disk Usage: ${metrics.system.diskUsage}`);
  console.log(`Running Processes: ${metrics.system.processCount}`);
  console.log(`Node Version: ${metrics.system.nodeVersion}`);
  console.log(`Platform: ${metrics.system.platform}`);
}

// CLI entry point
if (require.main === module) {
  getMetrics().then(metrics => {
    print(metrics);
  }).catch(err => {
    console.error('Error generating dashboard:', err);
    process.exit(1);
  });
}

module.exports = { getMetrics, getEvolutionMetrics, getSystemMetrics, print };
