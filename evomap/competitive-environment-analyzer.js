/**
 * 竞争环境分析器
 * 输入：历史尝试数据
 * 输出：环境类型标签 + 策略建议
 * 失败边界：数据不足(< 100样本)
 */

const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '.task-history.json');
const ANALYSIS_FILE = path.join(__dirname, '.environment-analysis.json');

class CompetitiveEnvironmentAnalyzer {
    constructor() {
        this.analysis = this.loadAnalysis();
    }

    loadAnalysis() {
        if (fs.existsSync(ANALYSIS_FILE)) {
            try {
                return JSON.parse(fs.readFileSync(ANALYSIS_FILE, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    saveAnalysis() {
        fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(this.analysis, null, 2));
    }

    /**
     * 分析竞争环境
     */
    analyzeEnvironment() {
        // 读取任务历史
        if (!fs.existsSync(HISTORY_FILE)) {
            return { type: 'unknown', reason: 'no_data' };
        }

        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        const tasks = Object.values(history);

        if (tasks.length < 10) {
            return { type: 'unknown', reason: 'insufficient_data' };
        }

        // 计算指标
        const totalAttempts = tasks.reduce((sum, t) => sum + t.attempts, 0);
        const totalSuccesses = tasks.reduce((sum, t) => sum + t.successes, 0);
        const successRate = totalSuccesses / totalAttempts;

        const uniqueTasks = tasks.length;
        const avgAttemptsPerTask = totalAttempts / uniqueTasks;

        // 计算竞争集中度（少数节点占主导？）
        const highFailureTasks = tasks.filter(t => t.attempts > 10 && t.successes === 0).length;
        const concentrationRatio = highFailureTasks / uniqueTasks;

        // 环境分类
        let envType, strategy;

        if (successRate === 0 && concentrationRatio > 0.8) {
            envType = 'saturated_market';
            strategy = 'avoid_or_wait'; // 避开或等待
        } else if (successRate < 0.05 && avgAttemptsPerTask > 5) {
            envType = 'oligopoly';
            strategy = 'find_niche'; // 寻找细分机会
        } else if (successRate > 0.1) {
            envType = 'dynamic_opportunity';
            strategy = 'aggressive_pursuit'; // 积极追求
        } else {
            envType = 'uncertain';
            strategy = 'continue_learning'; // 继续学习
        }

        const analysis = {
            type: envType,
            strategy: strategy,
            metrics: {
                totalAttempts,
                totalSuccesses,
                successRate: (successRate * 100).toFixed(2) + '%',
                uniqueTasks,
                avgAttemptsPerTask: avgAttemptsPerTask.toFixed(2),
                concentrationRatio: (concentrationRatio * 100).toFixed(2) + '%'
            },
            timestamp: Date.now()
        };

        this.analysis = analysis;
        this.saveAnalysis();

        return analysis;
    }

    /**
     * 获取当前环境类型
     */
    getCurrentEnvironment() {
        return this.analysis.type || 'unknown';
    }

    /**
     * 获取推荐策略
     */
    getRecommendedStrategy() {
        return this.analysis.strategy || 'learn';
    }

    /**
     * 判断是否应该退出当前环境
     */
    shouldWithdraw() {
        const type = this.getCurrentEnvironment();
        return type === 'saturated_market';
    }

    /**
     * 获取分析报告
     */
    getReport() {
        return this.analysis;
    }
}

module.exports = CompetitiveEnvironmentAnalyzer;
