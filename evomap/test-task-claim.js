/**
 * 测试EvoMap任务认领接口
 * POST /a2a/task/claim
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CONFIG_FILE = '.evomap-config.json';

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
 * 生成message_id
 */
function generateMessageId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `msg_${timestamp}_${random}`;
}

/**
 * 发送任务认领请求
 */
function claimTask(taskId) {
    const sender_id = getSenderId();
    const messageId = generateMessageId();
    const timestamp = new Date().toISOString();

    // 任务认领不需要完整信封，直接发送payload
    const requestBody = {
        task_id: taskId,
        node_id: sender_id
    };

    console.log('\n📤 认领任务...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Task ID:', taskId);
    console.log('Node ID:', sender_id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📥 原始响应:');
                console.log('HTTP Status:', res.statusCode);
                console.log('Body:', data);
                console.log('');

                try {
                    const response = JSON.parse(data);

                    if (res.statusCode === 200) {
                        console.log('✅ 任务认领成功！');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('Task ID:', response.task_id);
                        console.log('Status:', response.status);
                        console.log('Claimed At:', response.claimed_at);
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                        resolve(response);
                    } else if (res.statusCode === 409) {
                        console.log('ℹ️  任务已被认领 (task_full)');
                        console.log('💡 建议：稍后重试或选择其他任务\n');
                        resolve(null); // 不是错误，只是已被认领
                    } else {
                        console.error('❌ 认领失败');
                        console.error('HTTP', res.statusCode, ':', response.error || 'Unknown error');
                        reject(new Error(`HTTP ${res.statusCode}: ${response.error || 'Unknown error'}`));
                    }
                } catch (error) {
                    console.error('❌ 响应解析失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * 先获取任务列表，然后认领第一个
 */
async function listAndClaim() {
    const sender_id = getSenderId();
    const messageId = generateMessageId();
    const timestamp = new Date().toISOString();

    // 使用fetch端点获取任务
    const envelope = {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: 'fetch',
        message_id: messageId,
        sender_id: sender_id,
        timestamp: timestamp,
        payload: {
            include_tasks: true
        }
    };

    console.log('\n🔍 获取可用任务...');

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

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', async () => {
                try {
                    const fullResponse = JSON.parse(data);
                    const response = fullResponse.payload || {};

                    console.log('HTTP Status:', res.statusCode);

                    if (response.tasks && response.tasks.length > 0) {
                        console.log(`✅ 找到 ${response.tasks.length} 个任务\n`);

                        // 显示前3个任务
                        response.tasks.slice(0, 3).forEach((task, i) => {
                            console.log(`${i + 1}. [${task.task_id}] ${task.title}`);
                            console.log(`   悬赏: ${task.bounty || 0} credits`);
                            console.log(`   状态: ${task.status}\n`);
                        });

                        // 认领第一个任务
                        const firstTask = response.tasks[0];
                        console.log(`🤝 尝试认领任务: ${firstTask.title}...\n`);
                        await claimTask(firstTask.task_id);
                        resolve();
                    } else {
                        console.log('ℹ️  当前没有可用任务');
                        resolve();
                    }
                } catch (error) {
                    console.error('❌ 响应解析失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// 运行测试
async function main() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   EvoMap 任务认领接口测试             ║');
    console.log('╚══════════════════════════════════════╝\n');

    try {
        // 方式1: 直接认领指定任务
        if (process.argv[2]) {
            const taskId = process.argv[2];
            await claimTask(taskId);
        } else {
            // 方式2: 获取任务列表并认领第一个
            await listAndClaim();
        }

        console.log('✅ 测试完成！');
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { claimTask, listAndClaim };
