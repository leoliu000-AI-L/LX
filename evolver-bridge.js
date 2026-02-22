/**
 * Evolver Integration Bridge
 * 自动化Evolver和EvoMap之间的进化循环
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EVOLVER_DIR = path.join(__dirname, 'evolver-main');
const PCEC_HISTORY = path.join(EVOLVER_DIR, 'pcec-history.jsonl');
const EVOLVER_CMD = 'node index.js';

class EvolverBridge {
    constructor() {
        this.cycleCount = 0;
        this.publishedAssets = [];
    }

    /**
     * 记录PCEC周期到历史日志
     */
    logPCECCycle(event, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            cycle: this.cycleCount,
            event: event,
            ...details
        };

        const line = JSON.stringify(entry) + '\n';
        fs.appendFileSync(PCEC_HISTORY, line);
        console.log(`📝 Logged: ${event}`);
    }

    /**
     * 运行Evolver分析
     */
    async runEvolverAnalysis() {
        console.log('\n🔬 Running Evolver analysis...');

        try {
            const output = execSync(EVOLVER_CMD, {
                cwd: EVOLVER_DIR,
                encoding: 'utf8',
                timeout: 60000
            });

            console.log('✓ Evolver analysis complete');
            return { success: true, output };

        } catch (error) {
            console.log(`✗ Evolver failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 检查Evolver生成的候选
     */
    checkCandidates() {
        const candidatesFile = path.join(EVOLVER_DIR, 'assets/gep/candidates.jsonl');

        if (!fs.existsSync(candidatesFile)) {
            return [];
        }

        const content = fs.readFileSync(candidatesFile, 'utf8');
        const lines = content.trim().split('\n');
        const candidates = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch (e) {
                return null;
            }
        }).filter(c => c !== null);

        console.log(`📊 Found ${candidates.length} candidates`);
        return candidates;
    }

    /**
     * 分析候选信号模式
     */
    analyzeCandidatePatterns(candidates) {
        const signals = new Map();

        candidates.forEach(c => {
            if (c.signals) {
                c.signals.forEach(s => {
                    signals.set(s, (signals.get(s) || 0) + 1);
                });
            }
        });

        // 获取最常见的信号
        const topSignals = [...signals.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        console.log('\n🔍 Top signals:');
        topSignals.forEach(([signal, count]) => {
            console.log(`  ${signal}: ${count} occurrences`);
        });

        return topSignals;
    }

    /**
     * 生成进化资产建议
     */
    generateAssetSuggestions(candidates) {
        const suggestions = [];

        // 基于候选标题生成资产
        const titles = new Set();
        candidates.forEach(c => {
            if (c.title && !titles.has(c.title)) {
                titles.add(c.title);
                suggestions.push({
                    title: c.title,
                    signals: c.signals || [],
                    category: this.inferCategory(c.signals)
                });
            }
        });

        return suggestions.slice(0, 10); // 最多10个建议
    }

    /**
     * 推断资产类别
     */
    inferCategory(signals) {
        if (!signals || signals.length === 0) return 'innovate';

        const signalStr = signals.join(' ');
        if (signalStr.includes('error') || signalStr.includes('missing') || signalStr.includes('fail')) {
            return 'repair';
        }
        if (signalStr.includes('optimize') || signalStr.includes('efficient') || signalStr.includes('batch')) {
            return 'optimize';
        }
        return 'innovate';
    }

    /**
     * 运行完整的进化循环
     */
    async runEvolutionCycle() {
        this.cycleCount++;
        console.log('\n' + '='.repeat(60));
        console.log(`🧬 PCEC Cycle #${this.cycleCount}`);
        console.log('='.repeat(60));

        // 1. 记录周期开始
        this.logPCECCycle('cycle_start', {
            phase: 'evolver_integration',
            timestamp: Date.now()
        });

        // 2. 运行Evolver分析
        const analysisResult = await this.runEvolverAnalysis();

        if (!analysisResult.success) {
            this.logPCECCycle('evolver_failed', {
                error: analysisResult.error
            });
            return { success: false, error: analysisResult.error };
        }

        // 3. 检查候选
        const candidates = this.checkCandidates();
        this.logPCECCycle('candidates_found', {
            count: candidates.length
        });

        // 4. 分析模式
        const patterns = this.analyzeCandidatePatterns(candidates);
        this.logPCECCycle('patterns_analyzed', {
            top_patterns: patterns.map(([s, c]) => `${s}(${c})`).join(', ')
        });

        // 5. 生成建议
        const suggestions = this.generateAssetSuggestions(candidates);
        console.log(`\n💡 Generated ${suggestions.length} asset suggestions`);

        suggestions.forEach((s, i) => {
            console.log(`  ${i+1}. ${s.title}`);
            console.log(`     Category: ${s.category}, Signals: ${s.signals.length}`);
        });

        this.logPCECCycle('suggestions_generated', {
            count: suggestions.length
        });

        return {
            success: true,
            cycle: this.cycleCount,
            candidates: candidates.length,
            patterns: patterns.length,
            suggestions: suggestions.length
        };
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const publishedFile = 'evomap/.published-assets.json';
        if (!fs.existsSync(publishedFile)) {
            return { total: 0, verified: 0 };
        }

        const published = JSON.parse(fs.readFileSync(publishedFile, 'utf8'));
        const verified = published.filter(p => p.verified).length;

        return {
            total: published.length,
            verified: verified,
            rate: ((verified / published.length) * 100).toFixed(1) + '%'
        };
    }
}

// 主函数
async function main() {
    const bridge = new EvolverBridge();

    console.log('🌉 Evolver Integration Bridge');
    console.log('=========================\n');

    // 显示当前状态
    const stats = bridge.getStats();
    console.log('📊 Current Stats:');
    console.log(`  Total published: ${stats.total}`);
    console.log(`  Verified: ${stats.verified}`);
    console.log(`  Success rate: ${stats.rate}\n`);

    // 运行进化循环
    const result = await bridge.runEvolutionCycle();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Cycle Result');
    console.log('='.repeat(60));

    if (result.success) {
        console.log(`✓ Cycle #${result.cycle} completed successfully`);
        console.log(`  Candidates analyzed: ${result.candidates}`);
        console.log(`  Patterns found: ${result.patterns}`);
        console.log(`  Suggestions generated: ${result.suggestions}`);
    } else {
        console.log(`✗ Cycle failed: ${result.error}`);
    }

    console.log('='.repeat(60));
}

// 运行
main().catch(console.error);
