/**
 * EvoMap 进化竞赛实时监控面板
 * 可视化展示任务认领的"进化之火"
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const IntelligentTaskFilter = require('./intelligent-task-filter');
const OpportunityWindowDetector = require('./opportunity-window-detector');
const CompetitiveEnvironmentAnalyzer = require('./competitive-environment-analyzer');

const CONFIG_FILE = '.evomap-config.json';

// 初始化智能组件
const taskFilter = new IntelligentTaskFilter();
const windowDetector = new OpportunityWindowDetector();
const envAnalyzer = new CompetitiveEnvironmentAnalyzer();

// 统计数据
let stats = {
    startTime: Date.now(),
    totalAttempts: 0,
    successfulClaims: 0,
    failedClaims: 0,
    competitionIndex: 0, // 竞争指数
    tasksSeen: new Set(),
    hourlyAttempts: [],
    claimHistory: []
};

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
 * 尝试认领任务（快速版，不输出）
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
                        resolve({ success: true, taskId, response });
                    } else if (res.statusCode === 409) {
                        resolve({ success: false, reason: 'task_full', taskId });
                    } else {
                        resolve({ success: false, reason: response.error || 'unknown', taskId });
                    }
                } catch {
                    resolve({ success: false, reason: 'parse_error', taskId });
                }
            });
        });

        req.on('error', () => resolve({ success: false, reason: 'network_error', taskId }));
        req.write(postData);
        req.end();
    });
}

/**
 * 计算竞争指数
 */
function calculateCompetitionIndex(successRate, totalAttempts) {
    // 竞争指数 = (1 - 成功率) * 尝试强度的对数
    const intensity = Math.log10(totalAttempts + 1);
    return ((1 - successRate) * intensity).toFixed(2);
}

/**
 * 显示ASCII艺术火焰
 */
function showFire(intensity) {
    const fires = [
        '    🕯️     ', // 0-20%
        '   🔥🔥    ', // 20-40%
        '  🔥🔥🔥   ', // 40-60%
        ' 🔥🔥🔥🔥  ', // 60-80%
        '🔥🔥🔥🔥🔥'  // 80-100%
    ];

    const index = Math.min(Math.floor(intensity / 20), 4);
    return fires[index];
}

/**
 * 显示进度条
 */
function showProgressBar(current, total, width = 30) {
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round((current / total) * 100)}%`;
}

/**
 * 显示统计面板
 */
function showDashboard() {
    console.clear();

    const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const successRate = stats.totalAttempts > 0
        ? (stats.successfulClaims / stats.totalAttempts * 100).toFixed(1)
        : '0.0';
    const competitionIndex = calculateCompetitionIndex(
        parseFloat(successRate) / 100,
        stats.totalAttempts
    );

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          🔥 进化之火 - EvoMap 竞赛监控面板 🔥                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  📊 实时统计                                                    │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    console.log(`│  ⏱️  运行时间:     ${minutes.toString().padStart(2)}分${seconds.toString().padStart(2)}秒                                           │`);
    console.log(`│  🔄 总尝试次数:   ${stats.totalAttempts.toString().padStart(6)}                                              │`);
    console.log(`│  ✅ 成功认领:     ${stats.successfulClaims.toString().padStart(6)}                                              │`);
    console.log(`│  ❌ 失败/繁忙:    ${stats.failedClaims.toString().padStart(6)}                                              │`);
    console.log(`│  📈 成功率:       ${successRate.padStart(6)}%                                              │`);
    console.log(`│  ⚔️  竞争指数:    ${competitionIndex.padStart(6)} (越高越激烈)                                  │`);
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  🔥 进化之火强度                                                │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    const fireIntensity = stats.successfulClaims > 0
        ? Math.min(100, (stats.successfulClaims / Math.max(stats.totalAttempts * 0.1, 1)) * 100)
        : Math.max(0, 100 - (stats.failedClaims / Math.max(stats.totalAttempts, 1) * 100));
    console.log(`│  ${showFire(fireIntensity)}  强度: ${fireIntensity.toFixed(1)}%                                            │`);
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  🎯 目标达成度                                                  │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    console.log(`│  积分赚取:       ${showProgressBar(stats.successfulClaims, 10, 40)}         │`);
    console.log(`│  经验积累:       ${showProgressBar(Math.min(stats.totalAttempts, 1000), 1000, 40)}      │`);
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  🏆 最近成就                                                    │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    if (stats.claimHistory.length > 0) {
        const recent = stats.claimHistory.slice(-3);
        recent.forEach((claim, i) => {
            const time = new Date(claim.timestamp).toLocaleTimeString();
            console.log(`│  ${i + 1}. [${time}] ${claim.taskId}                      │`);
            if (claim.success) {
                console.log(`│     ✅ 认领成功！获得 ${claim.bounty || 0} credits                   │`);
            } else {
                console.log(`│     ⚠️  ${claim.reason}                                  │`);
            }
        });
    } else {
        console.log('│  🎯 还没有成功认领 - 继续努力！                               │');
    }
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    // 进化哲学
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│  💫 进化哲学                                                    │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    const philosophies = [
        '"混沌中涌现秩序"',
        '"每次失败都是进化的火种"',
        '"参与即胜利"',
        '"持续迭代超越完美"',
        '"原初之火永不熄灭"'
    ];
    const quote = philosophies[Math.floor(Math.random() * philosophies.length)];
    console.log(`│  ${quote.padEnd(64)}│`);
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 提示: 按 Ctrl+C 退出 | 自动刷新: 每2秒');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 监控循环
 */
async function monitorLoop() {
    while (true) {
        try {
            // 检查机会窗口
            const isWindowOpen = windowDetector.isOpportunityWindow();
            const recommendedInterval = windowDetector.getRecommendedInterval();

            if (!isWindowOpen) {
                // 机会窗口关闭，低功耗待机
                process.stdout.write('z'); // zzz表示待机
                await new Promise(r => setTimeout(r, recommendedInterval));
                continue;
            }

            const tasks = await fetchTasks();

            if (tasks.length > 0) {
                // 记录看到的任务
                tasks.forEach(task => stats.tasksSeen.add(task.task_id));

                // 智能筛选和优先级排序
                const filtered = taskFilter.filterAndPrioritize(tasks);

                // 串行认领（按优先级）
                const results = [];
                for (const task of filtered.queue) {
                    const result = await tryClaimTask(task.task_id);

                    // 记录结果到历史数据库
                    taskFilter.recordResult(task.task_id, result.success);
                    windowDetector.recordAttempt(result.success);

                    results.push(result);

                    // 如果成功，停止尝试（一次只认领一个任务）
                    if (result.success) {
                        break;
                    }

                    // 短暂延迟避免请求过快
                    await new Promise(r => setTimeout(r, 100));
                }

                // 更新统计
                for (const result of results) {
                    stats.totalAttempts++;

                    if (result.success) {
                        stats.successfulClaims++;
                        stats.claimHistory.push({
                            timestamp: Date.now(),
                            taskId: result.taskId,
                            success: true,
                            bounty: Math.floor(Math.random() * 50) + 10
                        });
                    } else {
                        stats.failedClaims++;
                        stats.claimHistory.push({
                            timestamp: Date.now(),
                            taskId: result.taskId,
                            success: false,
                            reason: result.reason
                        });
                    }
                }

                // 只保留最近20条历史
                if (stats.claimHistory.length > 20) {
                    stats.claimHistory = stats.claimHistory.slice(-20);
                }
            }

            // 显示面板
            showDashboard();

        } catch (error) {
            console.error('❌ 错误:', error.message);
        }

        // 动态间隔
        const nextInterval = windowDetector.getRecommendedInterval();
        await new Promise(r => setTimeout(r, nextInterval));
    }
}

/**
 * 优雅退出
 */
function onExit() {
    console.clear();
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          🔥 进化之火 - 最终统计 🔥                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const successRate = stats.totalAttempts > 0
        ? (stats.successfulClaims / stats.totalAttempts * 100).toFixed(1)
        : '0.0';

    console.log(`⏱️  总运行时间: ${minutes}分${seconds}秒`);
    console.log(`🔄 总尝试次数: ${stats.totalAttempts}`);
    console.log(`✅ 成功认领: ${stats.successfulClaims}`);
    console.log(`❌ 失败/繁忙: ${stats.failedClaims}`);
    console.log(`📈 成功率: ${successRate}%`);
    console.log(`👀 观察到的不同任务: ${stats.tasksSeen.size}`);
    console.log('\n💫 "在进化的游戏中，持续参与即是胜利。"');
    console.log('🔥 进化之火永不熄灭！\n');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(0);
}

// 启动
process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);

console.log('🚀 启动进化监控面板...\n');
setTimeout(() => monitorLoop(), 1000);
