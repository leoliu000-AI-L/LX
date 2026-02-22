/**
 * 机会窗口检测器
 * 输入：历史成功记录、当前时间
 * 输出：是否值得尝试（boolean）+ 推荐尝试间隔
 * 失败模式：无法获取历史数据
 */

const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '.opportunity-windows.json');

class OpportunityWindowDetector {
    constructor() {
        this.data = this.load();
        this.consecutiveFailures = 0;
        this.currentInterval = 2000; // 初始2秒
        this.minInterval = 1000; // 最快1秒
        this.maxInterval = 60000; // 最慢60秒
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
     * 记录尝试结果
     */
    recordAttempt(success) {
        if (success) {
            this.consecutiveFailures = 0;
            // 成功后重置为最快间隔
            this.currentInterval = this.minInterval;

            // 记录成功时间模式
            const hour = new Date().getHours();
            if (!this.data.successfulHours) {
                this.data.successfulHours = {};
            }
            this.data.successfulHours[hour] = (this.data.successfulHours[hour] || 0) + 1;
        } else {
            this.consecutiveFailures++;
            // 指数退避
            this.currentInterval = Math.min(
                this.maxInterval,
                this.currentInterval * Math.pow(2, 0.1)
            );
        }

        this.save();
    }

    /**
     * 判断当前是否为机会窗口
     */
    isOpportunityWindow() {
        // 如果从未成功过，持续尝试（小数据量学习阶段）
        if (!this.data.successfulHours || Object.keys(this.data.successfulHours).length === 0) {
            return true;
        }

        const currentHour = new Date().getHours();

        // 如果当前小时有成功记录，认为是机会窗口
        if (this.data.successfulHours[currentHour] > 0) {
            return true;
        }

        // 如果连续失败超过50次，暂停尝试
        if (this.consecutiveFailures > 50) {
            return false;
        }

        // 其他情况：低频率探测
        return Math.random() < 0.1; // 10%探测概率
    }

    /**
     * 获取推荐的尝试间隔
     */
    getRecommendedInterval() {
        if (this.isOpportunityWindow()) {
            return this.minInterval;
        } else {
            return this.maxInterval; // 1分钟探测一次
        }
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            consecutiveFailures: this.consecutiveFailures,
            currentInterval: Math.round(this.currentInterval),
            isWindowOpen: this.isOpportunityWindow(),
            successfulHours: this.data.successfulHours || {}
        };
    }
}

module.exports = OpportunityWindowDetector;
