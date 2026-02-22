/**
 * EvoMap任务监听器
 * 持续监听并自动认领任务，赚取积分
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
 * 认领单个任务
 */
function claimTask(taskId, taskTitle) {
    const sender_id = getSenderId();

    const requestBody = {
        task_id: taskId,
        node_id: sender_id
    };

    return new Promise((resolve, reject) => {
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
                    reject(error);
                }
            });
        });

        req.on('error', () => resolve({ success: false, reason: 'network_error', title: taskTitle }));
        req.write(postData);
        req.end();
    });
}

/**
 * 显示统计信息
 */
function showStats() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    console.log('\n' + '━'.repeat(60));
    console.log('📊 运行统计');
    console.log('━'.repeat(60));
    console.log(`⏱️  运行时间: ${minutes}分${seconds}秒`);
    console.log(`✅ 成功认领: ${claimedCount} 个任务`);
    console.log(`❌ 失败/繁忙: ${failedCount} 次`);
    console.log(`📈 认领成功率: ${claimedCount + failedCount > 0 ? Math.round(claimedCount / (claimedCount + failedCount) * 100) : 0}%`);
    console.log('━'.repeat(60) + '\n');
}

/**
 * 主循环
 */
async function mainLoop() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   EvoMap 任务监听器启动 🚀           ║');
    console.log('╚══════════════════════════════════════╝\n');
    console.log('⚡ 模式: 持续监听 + 快速认领');
    console.log('🎯 目标: 帮你赚取更多积分！');
    console.log('💡 提示: 按 Ctrl+C 退出\n');

    const checkInterval = 5000; // 每5秒检查一次

    // 定时显示统计
    setInterval(showStats, 60000); // 每分钟显示统计

    while (true) {
        try {
            const tasks = await fetchTasks();

            if (tasks.length > 0) {
                console.log(`\n🔍 发现 ${tasks.length} 个任务`);

                // 尝试认领所有任务
                for (const task of tasks) {
                    const result = await claimTask(task.task_id, task.title);

                    if (result.success) {
                        claimedCount++;
                        console.log(`\n✅ 成功认领任务！`);
                        console.log(`📌 ${result.title}`);
                        console.log(`💰 悬赏: ${task.bounty || 0} credits`);
                        console.log(`🆔 Task ID: ${result.task.task_id}`);
                    } else {
                        failedCount++;
                        if (result.reason !== 'task_full') {
                            console.log(`⚠️  认领失败: ${result.reason} - ${result.title.substring(0, 50)}...`);
                        }
                    }

                    // 短暂延迟避免请求过快
                    await new Promise(r => setTimeout(r, 500));
                }
            } else {
                process.stdout.write('.');
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
    console.log('💰 总共认领了 ' + claimedCount + ' 个任务！');
    console.log('👋 再见！\n');
    process.exit(0);
});

// 启动
mainLoop().catch(console.error);
