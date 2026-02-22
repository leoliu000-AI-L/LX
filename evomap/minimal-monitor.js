/**
 * 极简EvoMap监控器
 * 价值导向: 最小成本 + 最大确定性
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CONFIG_FILE = '.evomap-config.json';
const STATE_FILE = '.minimal-state.json';

/**
 * 极简状态管理
 */
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        } catch (e) {
            return { consecutiveFailures: 0 };
        }
    }
    return { consecutiveFailures: 0 };
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * 获取sender_id
 */
function getSenderId() {
    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error('配置文件不存在');
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
    return config.sender_id;
}

/**
 * 获取任务列表
 */
function fetchTasks() {
    const sender_id = getSenderId();
    const envelope = {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: 'fetch',
        message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sender_id: sender_id,
        timestamp: new Date().toISOString(),
        payload: { include_tasks: true }
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
                    resolve(fullResponse.payload?.tasks || []);
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
 * 尝试认领任务
 */
function tryClaimTask(taskId) {
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
                        resolve({ success: true, taskId });
                    } else if (res.statusCode === 409) {
                        resolve({ success: false, reason: 'task_full' });
                    } else {
                        resolve({ success: false, reason: response.error || 'unknown' });
                    }
                } catch {
                    resolve({ success: false, reason: 'parse_error' });
                }
            });
        });

        req.on('error', () => resolve({ success: false, reason: 'network_error' }));
        req.write(postData);
        req.end();
    });
}

/**
 * 计算退避间隔
 * 连续失败越多，间隔越长
 */
function calculateBackoff(consecutiveFailures) {
    // 基础2秒，每10次失败翻倍，最大60秒
    const base = 2000;
    const multiplier = Math.pow(2, Math.floor(consecutiveFailures / 10));
    const backoff = Math.min(60000, base * multiplier);
    return backoff;
}

/**
 * 极简监控循环
 */
async function minimalMonitor() {
    let stats = {
        startTime: Date.now(),
        attempts: 0,
        successes: 0
    };

    let state = loadState();

    console.log('🚀 极简监控器启动');
    console.log('📊 策略: 连续失败 → 指数退避');
    console.log('⏰ 初始间隔: 2秒\n');

    while (true) {
        try {
            const tasks = await fetchTasks();

            if (tasks.length > 0) {
                // 尝试认领第一个任务（最简单策略）
                const result = await tryClaimTask(tasks[0].task_id);

                stats.attempts++;

                if (result.success) {
                    stats.successes++;
                    state.consecutiveFailures = 0;
                    console.log(`✅ 成功! [${new Date().toLocaleTimeString()}] ${tasks[0].task_id}`);
                } else {
                    state.consecutiveFailures++;
                    process.stdout.write('F');
                }

                saveState(state);
            }

            // 计算下次间隔
            const interval = calculateBackoff(state.consecutiveFailures);

            // 每60秒显示一次状态
            if (stats.attempts % 30 === 0) {
                const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
                const rate = stats.successes / stats.attempts;
                console.log(`\n📊 ${Math.floor(elapsed/60)}分 | ${stats.attempts}次 | ${stats.successes}成功 | ${(rate*100).toFixed(1)}% | 退避: ${Math.round(interval/1000)}秒\n`);
            }

        } catch (error) {
            console.error('❌', error.message);
            state.consecutiveFailures++;
            saveState(state);
        }

        // 等待下次尝试
        const interval = calculateBackoff(state.consecutiveFailures);
        await new Promise(r => setTimeout(r, interval));
    }
}

// 启动
minimalMonitor().catch(console.error);
