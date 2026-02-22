/**
 * EvoMap定时调度器
 * 自动定期同步EvoMap，处理任务
 */

const EvoMapAgent = require('./evomap-agent-wrapper');

class EvoMapScheduler {
    constructor(config) {
        this.agent = new EvoMapAgent(config);
        this.syncInterval = config.sync_interval || 4 * 60 * 60 * 1000; // 默认4小时
        this.autoClaimTasks = config.auto_claim_tasks !== false; // 默认启用
        this.timer = null;
        this.isRunning = false;
    }

    /**
     * 启动定时同步
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️ 调度器已在运行');
            return;
        }

        console.log('\n🚀 启动EvoMap定时调度器...');
        console.log(`   同步间隔: ${this.syncInterval / 1000 / 60} 分钟`);
        console.log(`   自动声明任务: ${this.autoClaimTasks ? '是' : '否'}`);
        console.log('');

        this.isRunning = true;

        // 立即执行一次同步
        this.sync().catch(error => {
            console.error('初始同步失败:', error.message);
        });

        // 设置定时任务
        this.timer = setInterval(() => {
            this.sync().catch(error => {
                console.error('定时同步失败:', error.message);
            });
        }, this.syncInterval);

        console.log('✅ 调度器已启动\n');
    }

    /**
     * 停止定时同步
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ 调度器未在运行');
            return;
        }

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.isRunning = false;
        console.log('\n⏹️ EvoMap调度器已停止');
    }

    /**
     * 同步逻辑
     */
    async sync() {
        const timestamp = new Date().toISOString();
        console.log(`\n${timestamp} - 开始EvoMap同步`);
        console.log('━'.repeat(60));

        try {
            // 1. 获取新资产和任务
            const result = await this.agent.sync();

            // 2. 处理可用任务
            if (this.autoClaimTasks && result.tasks && result.tasks.length > 0) {
                console.log(`\n📋 发现 ${result.tasks.length} 个可用任务`);

                // 过滤符合声望要求的任务
                const eligibleTasks = this.filterEligibleTasks(result.tasks);

                if (eligibleTasks.length > 0) {
                    console.log(`✅ 符合条件的任务: ${eligibleTasks.length}个`);

                    // 选择最佳任务
                    const bestTask = this.selectBestTask(eligibleTasks);

                    if (bestTask) {
                        console.log(`\n🎯 最佳任务:`);
                        console.log(`   标题: ${bestTask.title || 'Untitled'}`);
                        console.log(`   赏金: $${bestTask.bounty_amount || 'N/A'}`);
                        console.log(`   任务ID: ${bestTask.task_id}`);

                        // 注意：这里只记录，不自动声明
                        // 实际声明需要根据你的Agent逻辑决定
                        console.log(`\n💡 提示: 请使用 agent.claimAndSolveTask('${bestTask.task_id}', solveFunction) 来解决此任务`);
                    }
                } else {
                    console.log('⚠️ 声望不足，无法声明任务');
                }
            } else {
                console.log('\n📋 暂无可用任务');
            }

            console.log('\n' + '━'.repeat(60));
            console.log('✅ 同步完成\n');

        } catch (error) {
            console.error('\n❌ 同步失败:', error.message);
            console.error('━'.repeat(60) + '\n');
        }
    }

    /**
     * 过滤符合声望要求的任务
     */
    filterEligibleTasks(tasks) {
        return tasks.filter(task => {
            const minRep = task.min_reputation || 0;
            return this.agent.reputation >= minRep;
        });
    }

    /**
     * 选择最佳任务
     */
    selectBestTask(tasks) {
        if (tasks.length === 0) {
            return null;
        }

        // 按赏金排序
        const sorted = [...tasks].sort((a, b) => {
            const bountyA = a.bounty_amount || 0;
            const bountyB = b.bounty_amount || 0;
            return bountyB - bountyA;
        });

        return sorted[0];
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            syncInterval: this.syncInterval,
            autoClaimTasks: this.autoClaimTasks,
            stats: this.agent.getStats()
        };
    }
}

module.exports = EvoMapScheduler;
