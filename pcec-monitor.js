/**
 * PCEC自动化监控循环
 * 每3小时自动运行一次进化循环
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PCEC_INTERVAL = 3 * 60 * 60 * 1000; // 3小时
const STATE_FILE = '.pcec-monitor-state.json';

class PCECMonitor {
    constructor() {
        this.state = this.loadState();
        this.running = false;
    }

    loadState() {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
        return {
            lastCycle: 0,
            cycleCount: 0,
            startTime: Date.now()
        };
    }

    saveState() {
        fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    }

    async runCycle() {
        if (this.running) {
            console.log('⏸️ Cycle already running, skipping...');
            return;
        }

        this.running = true;
        this.state.cycleCount++;

        console.log('\n' + '='.repeat(60));
        console.log(`🧬 PCEC Cycle #${this.state.cycleCount}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
        console.log('='.repeat(60));

        try {
            // 步骤1: 运行Evolver分析
            console.log('\n📊 Step 1: Running Evolver analysis...');
            try {
                execSync('node evolver-bridge.js', {
                    cwd: __dirname,
                    stdio: 'inherit',
                    timeout: 60000
                });
                console.log('✓ Evolver analysis complete');
            } catch (error) {
                console.log('⚠️  Evolver analysis failed (continuing)...');
            }

            // 步骤2: 自动发布资产
            console.log('\n📦 Step 2: Auto-publishing assets...');
            try {
                execSync('node auto-evolve-publish.js', {
                    cwd: __dirname,
                    stdio: 'inherit',
                    timeout: 90000
                });
                console.log('✓ Auto-publishing complete');
            } catch (error) {
                console.log('⚠️  Auto-publishing failed (continuing)...');
            }

            // 步骤3: 生成报告
            console.log('\n📋 Step 3: Generating report...');
            try {
                execSync('node evolution-report.js', {
                    cwd: __dirname,
                    stdio: 'inherit',
                    timeout: 10000
                });
                console.log('✓ Report generated');
            } catch (error) {
                console.log('⚠️  Report generation failed');
            }

            // 更新状态
            this.state.lastCycle = Date.now();
            this.saveState();

            console.log('\n✅ PCEC Cycle completed successfully');

        } catch (error) {
            console.error(`\n❌ Cycle error: ${error.message}`);
        } finally {
            this.running = false;
        }

        console.log('='.repeat(60));
        this.scheduleNext();
    }

    scheduleNext() {
        const now = Date.now();
        const elapsed = now - this.state.lastCycle;
        const remaining = PCEC_INTERVAL - elapsed;

        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

        console.log(`\n⏭️  Next cycle in ${hours}h ${minutes}m`);
        console.log(`📅 Scheduled at: ${new Date(now + remaining).toLocaleString()}\n`);

        setTimeout(() => {
            this.runCycle();
        }, remaining);
    }

    start() {
        console.log('🚀 Starting PCEC Monitor');
        console.log('======================\n');
        console.log(`📊 Current state:`);
        console.log(`  Cycle count: ${this.state.cycleCount}`);
        console.log(`  Last cycle: ${this.state.lastCycle ? new Date(this.state.lastCycle).toLocaleString() : 'Never'}`);
        console.log(`  Interval: ${PCEC_INTERVAL / (60 * 60 * 1000)} hours\n`);

        // 检查是否应该立即运行
        const now = Date.now();
        const timeSinceLastCycle = now - this.state.lastCycle;

        if (timeSinceLastCycle >= PCEC_INTERVAL || this.state.lastCycle === 0) {
            console.log('▶️  Starting cycle immediately...\n');
            this.runCycle();
        } else {
            console.log('⏳ Waiting for next cycle...\n');
            this.scheduleNext();
        }
    }
}

// 主函数
async function main() {
    const monitor = new PCECMonitor();

    // 处理命令行参数
    const args = process.argv.slice(2);

    if (args.includes('--once')) {
        console.log('🔄 Running single cycle...\n');
        await monitor.runCycle();
    } else if (args.includes('--report')) {
        console.log('📋 Generating report...\n');
        execSync('node evolution-report.js', { stdio: 'inherit' });
    } else if (args.includes('--status')) {
        console.log('📊 PCEC Monitor Status:\n');
        console.log(`  Cycles completed: ${monitor.state.cycleCount}`);
        console.log(`  Last cycle: ${monitor.state.lastCycle ? new Date(monitor.state.lastCycle).toLocaleString() : 'Never'}`);
        console.log(`  Running: ${monitor.running}`);
    } else {
        // 默认启动持续监控
        monitor.start();

        // 保持进程运行
        console.log('💤 Monitor is running. Press Ctrl+C to stop.\n');
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Stopping PCEC Monitor...');
            monitor.saveState();
            console.log('✓ State saved. Goodbye!');
            process.exit(0);
        });
    }
}

main().catch(console.error);
