/**
 * 智能任务筛选器
 * 输入：任务列表
 * 输出：优先级排序的认领队列
 * 失败模式：网络错误、任务已满
 */

const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '.task-history.json');

/**
 * 任务历史数据库
 */
class TaskHistoryDB {
    constructor() {
        this.data = this.load();
    }

    load() {
        if (fs.existsSync(HISTORY_FILE)) {
            try {
                return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        return {};
    }

    save() {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.data, null, 2));
    }

    /**
     * 记录任务尝试
     */
    recordAttempt(taskId, success) {
        if (!this.data[taskId]) {
            this.data[taskId] = {
                attempts: 0,
                successes: 0,
                firstSeen: Date.now(),
                lastAttempt: Date.now()
            };
        }

        this.data[taskId].attempts++;
        this.data[taskId].lastAttempt = Date.now();

        if (success) {
            this.data[taskId].successes++;
        }

        this.save();
    }

    /**
     * 计算任务竞争度
     * 返回: 0-1，越高竞争越激烈
     */
    getCompetitionLevel(taskId) {
        const record = this.data[taskId];
        if (!record) return 0.5; // 未知任务，中等竞争度

        if (record.attempts < 3) return 0.5; // 数据不足

        const successRate = record.successes / record.attempts;

        // 成功率越低，竞争度越高
        return 1 - successRate;
    }

    /**
     * 判断是否应该跳过该任务
     */
    shouldSkip(taskId) {
        const record = this.data[taskId];

        // 无记录：不跳过
        if (!record) return false;

        // 连续失败超过10次：跳过
        const recentFailures = record.attempts - record.successes;
        if (recentFailures > 10) return true;

        // 过去1小时尝试超过20次全失败：跳过
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        if (record.lastAttempt > oneHourAgo && record.successes === 0 && record.attempts > 20) {
            return true;
        }

        return false;
    }
}

/**
 * 任务优先级计算器
 */
class TaskPrioritizer {
    constructor(historyDB) {
        this.history = historyDB;
    }

    /**
     * 计算任务优先级分数
     * 分数越高，优先级越高
     */
    calculateScore(task) {
        const competitionLevel = this.history.getCompetitionLevel(task.task_id);

        // 基础分：悬赏金额
        let score = task.bounty || 0;

        // 竞争调整：竞争度越低，加分越多
        score += (1 - competitionLevel) * 100;

        // 新任务奖励：第一次见到的任务
        if (!this.history.data[task.task_id]) {
            score += 50;
        }

        return score;
    }

    /**
     * 排序任务列表
     */
    prioritize(tasks) {
        // 过滤掉应该跳过的任务
        const filtered = tasks.filter(task =>
            !this.history.shouldSkip(task.task_id)
        );

        // 计算分数并排序
        const scored = filtered.map(task => ({
            ...task,
            score: this.calculateScore(task)
        }));

        return scored.sort((a, b) => b.score - a.score);
    }
}

/**
 * 智能任务筛选器主类
 */
class IntelligentTaskFilter {
    constructor() {
        this.history = new TaskHistoryDB();
        this.prioritizer = new TaskPrioritizer(this.history);
    }

    /**
     * 处理任务列表
     */
    filterAndPrioritize(tasks) {
        const prioritized = this.prioritizer.prioritize(tasks);

        return {
            queue: prioritized,
            skipped: tasks.length - prioritized.length,
            total: tasks.length
        };
    }

    /**
     * 记录认领结果
     */
    recordResult(taskId, success) {
        this.history.recordAttempt(taskId, success);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const allTasks = Object.keys(this.history.data);
        const totalAttempts = Object.values(this.history.data)
            .reduce((sum, record) => sum + record.attempts, 0);

        return {
            knownTasks: allTasks.length,
            totalAttempts,
            uniqueTasks: allTasks.length
        };
    }
}

module.exports = IntelligentTaskFilter;
