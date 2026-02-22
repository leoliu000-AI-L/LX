/**
 * 飞书API超时修复包装器
 * 为现有的feishu-post/feishu-card添加超时保护
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/**
 * 带超时保护的exec包装器
 * @param {string} command - 要执行的命令
 * @param {object} options - 执行选项
 * @param {number} timeout - 超时时间（毫秒）
 * @param {number} maxRetries - 最大重试次数
 */
async function execWithTimeout(command, options = {}, timeout = 60000, maxRetries = 3) {
    const delays = [1000, 2000, 5000]; // 指数退避：1s, 2s, 5s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await exec(command, {
                ...options,
                timeout: timeout,
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });

            if (attempt > 0) {
                console.log(`✓ 命令执行成功 (重试 ${attempt} 次后)`);
            }

            return result;

        } catch (error) {
            const isLastAttempt = attempt === maxRetries - 1;

            if (error.killed) {
                console.error(`✗ 命令执行超时 (${timeout}ms)，尝试 ${attempt + 1}/${maxRetries}`);
            } else {
                console.error(`✗ 命令执行失败: ${error.message}，尝试 ${attempt + 1}/${maxRetries}`);
            }

            if (isLastAttempt) {
                console.error(`✗ 已达最大重试次数 (${maxRetries})`);
                throw new Error(`命令失败: ${error.message} (已重试 ${maxRetries} 次)`);
            }

            // 等待后重试
            const delay = delays[attempt];
            console.log(`⏳ ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * 安全的飞书消息发送
 * @param {string} message - 消息内容
 * @param {object} options - 选项
 */
async function sendFeishuMessageSafe(message, options = {}) {
    const {
        timeout = 60000,
        maxRetries = 3,
        useCard = false
    } = options;

    const repoRoot = path.resolve(__dirname, '..');

    // 检查feishu-post是否存在
    const feishuPostPath = path.join(repoRoot, 'skills/feishu-post/index.js');
    const feishuCardPath = path.join(repoRoot, 'skills/feishu-card/index.js');

    if (useCard && fs.existsSync(feishuCardPath)) {
        console.log('📤 使用 feishu-card 发送富文本消息');
        return await execWithTimeout(
            `node skills/feishu-card/index.js "${message.replace(/"/g, '\\"')}"`,
            { cwd: repoRoot },
            timeout,
            maxRetries
        );
    } else if (fs.existsSync(feishuPostPath)) {
        console.log('📤 使用 feishu-post 发送文本消息');
        return await execWithTimeout(
            `node skills/feishu-post/index.js "${message.replace(/"/g, '\\"')}"`,
            { cwd: repoRoot },
            timeout,
            maxRetries
        );
    } else {
        console.log('⚠️  feishu-post/feishu-card 模块不存在，跳过发送');
        return { skipped: true, message: '飞书模块未安装' };
    }
}

/**
 * 批量发送消息（避免触发限流）
 * @param {Array<string>} messages - 消息列表
 * @param {number} batchSize - 批次大小
 * @param {number} delayBetweenBatches - 批次间延迟（毫秒）
 */
async function batchSendFeishuMessages(messages, batchSize = 5, delayBetweenBatches = 1000) {
    const results = [];
    const totalBatches = Math.ceil(messages.length / batchSize);

    for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        console.log(`📦 发送批次 ${batchNum}/${totalBatches}`);

        for (const msg of batch) {
            try {
                const result = await sendFeishuMessageSafe(msg);
                results.push({ success: true, message: msg, result });
            } catch (error) {
                results.push({ success: false, message: msg, error: error.message });
            }
        }

        // 批次间延迟
        if (i + batchSize < messages.length) {
            console.log(`⏳ 等待 ${delayBetweenBatches}ms 后继续...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }

    return results;
}

/**
 * 飞书API调用监控
 * 记录API调用的时间和成功率
 */
class FeishuAPIMonitor {
    constructor() {
        this.calls = [];
        this.successCount = 0;
        this.failureCount = 0;
        this.totalTimeout = 0;
    }

    recordCall(callInfo) {
        this.calls.push({
            ...callInfo,
            timestamp: new Date().toISOString()
        });

        if (callInfo.success) {
            this.successCount++;
        } else {
            this.failureCount++;
        }

        if (callInfo.duration) {
            this.totalTimeout += callInfo.duration;
        }
    }

    async monitoredCall(callFn, callInfo) {
        const startTime = Date.now();
        let result;

        try {
            result = await callFn();
            const duration = Date.now() - startTime;

            this.recordCall({
                ...callInfo,
                success: true,
                duration: duration
            });

            console.log(`✓ API调用成功 (${duration}ms)`);
            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            this.recordCall({
                ...callInfo,
                success: false,
                duration: duration,
                error: error.message
            });

            console.error(`✗ API调用失败 (${duration}ms): ${error.message}`);
            throw error;
        }
    }

    getStats() {
        const totalCalls = this.successCount + this.failureCount;
        const successRate = totalCalls > 0 ? (this.successCount / totalCalls * 100).toFixed(1) : 0;
        const avgDuration = totalCalls > 0 ? (this.totalTimeout / totalCalls).toFixed(0) : 0;

        return {
            totalCalls,
            successCount: this.successCount,
            failureCount: this.failureCount,
            successRate: `${successRate}%`,
            avgDuration: `${avgDuration}ms`,
            recentCalls: this.calls.slice(-10)
        };
    }

    printStats() {
        const stats = this.getStats();
        console.log('\n📊 飞书API调用统计:');
        console.log(`   总调用: ${stats.totalCalls}`);
        console.log(`   成功: ${stats.successCount}`);
        console.log(`   失败: ${stats.failureCount}`);
        console.log(`   成功率: ${stats.successRate}`);
        console.log(`   平均耗时: ${stats.avgDuration}`);
    }
}

// 导出
module.exports = {
    execWithTimeout,
    sendFeishuMessageSafe,
    batchSendFeishuMessages,
    FeishuAPIMonitor
};

/**
 * 使用示例
 */
async function exampleUsage() {
    // 示例1: 带超时的命令执行
    try {
        const result = await execWithTimeout(
            'node skills/feishu-post/index.js "测试消息"',
            {},
            30000,  // 30秒超时
            3       // 重试3次
        );
        console.log('命令输出:', result.stdout);
    } catch (error) {
        console.error('命令最终失败:', error.message);
    }

    // 示例2: 安全发送消息
    const sendResult = await sendFeishuMessageSafe('重要通知内容');
    if (sendResult.skipped) {
        console.log('消息未发送（模块未安装）');
    }

    // 示例3: 批量发送
    const messages = [
        '消息1: 第一条内容',
        '消息2: 第二条内容',
        '消息3: 第三条内容'
    ];

    const batchResults = await batchSendFeishuMessages(messages, 2, 500);
    console.log(`批量发送完成: ${batchResults.filter(r => r.success).length}/${batchResults.length} 成功`);

    // 示例4: 监控API调用
    const monitor = new FeishuAPIMonitor();

    await monitor.monitoredCall(
        () => sendFeishuMessageSafe('监控的API调用'),
        { operation: 'send_notification', context: 'evolution_report' }
    );

    monitor.printStats();
}

// 直接运行示例
if (require.main === module) {
    exampleUsage().catch(console.error);
}
