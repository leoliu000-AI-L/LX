/**
 * EvoMap任务监听器 - TURBO版 🚀
 * 并发认领 + 更快检查频率 + 智能重试
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CONFIG_FILE = '.evomap-config.json';
let claimedCount = 0;
let failedCount = 0;
let startTime = Date.now();

/**
 * 加载sender_id
 */
function getSenderId() {
    if (!fs.existsSync(CONFIG_FILE)) {
        console.error('❌ 配置文件不存在，请先运行 node register-node.js');
        process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
    return config.sender_id;
}

/**
 * 获取任务列表
 */
function fetchTasks() {
    const sender_id = getSenderId();
    const messageId = `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const envelope = {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: 'fetch',
        message_id: messageId,
        sender_id: sender_id,
        timestamp: new Date().toISOString(),
        payload: {
            include_tasks: true
        }
    };

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(envelope);

        const options = {
            hostname: 'evomap.ai',
            port: 443,
            path: '/a2a/fetch',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const fullResponse = JSON.parse(data);
                    const response = fullResponse.payload || {};
                    resolve(response.tasks || []);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * 认领单个任务（无锁，支持并发）
 */
function claimTask(taskId, taskTitle) {
    const sender_id = getSenderId();

    const requestBody = {
        task_id: taskId,
        node_id: sender_id
    };

    return new Promise((resolve) => {
        const postData = JSON.stringify(requestBody);

        const options = {
            hostname: 'evomap.ai',
            port: 443,
            path: '/a2a/task/claim',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (res.statusCode === 200) {
                        resolve({ success: true, task: response, title: taskTitle });
                    } else if (res.statusCode === 409) {
                        resolve({ success: false, reason: 'task_full', title: taskTitle });
                    } else {
                        resolve({ success: false, reason: response.error || 'unknown', title: taskTitle });
                    }
                } catch (error) {
                    resolve({ success: false, reason: 'parse_error', title: taskTitle });
                }
            });
        });

        req.on('error', () => resolve({ success: false, reason: 'network_error', title: taskTitle }));
        req.write(postData);
        req.end();
    });
}

/**
 * 并发认领所有任务
 */
async function claimAllTasks(tasks) {
    console.log(`\n🚀 并发认领 ${tasks.length} 个任务...`);

    // 创建所有认领Promise
    const claimPromises = tasks.map(task => claimTask(task.task_id, task.title));

    // 并发执行所有认领
    const results = await Promise.all(claimPromises);

    // 统计结果
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    successes.forEach(result => {
        claimedCount++;
        console.log(`\n✅ 成功认领！`);
        console.log(`📌 ${result.title}`);
        console.log(`🆔 ID: ${result.task.task_id}`);
    });

    failedCount += failures.length;

    if (successes.length > 0) {
        console.log(`\n🎉 本轮成功: ${successes.length} 个`);
    } else {
        // 所有任务都繁忙，不显示详细信息避免刷屏
        process.stdout.write('F');
    }
}

/**
 * 显示统计信息
 */
function showStats() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const total = claimedCount + failedCount;
    const successRate = total > 0 ? Math.round(claimedCount / total * 100) : 0;

    console.log('\n' + '━'.repeat(60));
    console.log('📊 运行统计');
    console.log('━'.repeat(60));
    console.log(`⏱️  运行时间: ${minutes}分${seconds}秒`);
    console.log(`✅ 成功认领: ${claimedCount} 个任务`);
    console.log(`❌ 失败/繁忙: ${failedCount} 次`);
    console.log(`📈 认领成功率: ${successRate}%`);
    console.log(`💰 预估收益: ${claimedCount * 10}+ credits`); // 假设每个任务平均10 credits
    console.log('━'.repeat(60) + '\n');
}

/**
 * 主循环
 */
async function mainLoop() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   EvoMap 任务监听器 TURBO 🚀🚀🚀     ║');
    console.log('╚══════════════════════════════════════╝\n');
    console.log('⚡ 模式: 并发认领 + 快速检查');
    console.log('🎯 目标: 最大化认领成功率！');
    console.log('💪 策略: 同时认领所有可用任务');
    console.log('💡 提示: 按 Ctrl+C 退出\n');

    const checkInterval = 2000; // 每2秒检查一次（更快！）

    // 定时显示统计
    setInterval(showStats, 30000); // 每30秒显示统计

    while (true) {
        try {
            const tasks = await fetchTasks();

            if (tasks.length > 0) {
                process.stdout.write(`\n[${new Date().toLocaleTimeString()}] 发现 ${tasks.length} 个任务`);

                // 并发认领所有任务
                await claimAllTasks(tasks);
            }

        } catch (error) {
            failedCount++;
            console.error(`\n❌ 错误: ${error.message}`);
        }

        // 等待下一次检查
        await new Promise(r => setTimeout(r, checkInterval));
    }
}

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n\n╔══════════════════════════════════════╗');
    console.log('║   监听器停止                         ║');
    console.log('╚══════════════════════════════════════╝');
    showStats();
    console.log('🎯 总共认领了 ' + claimedCount + ' 个任务！');
    console.log('💰 继续加油，积分滚滚来！');
    console.log('👋 再见！\n');
    process.exit(0);
});

// 启动
mainLoop().catch(console.error);
