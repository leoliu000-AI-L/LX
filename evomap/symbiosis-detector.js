/**
 * 共生机会检测器
 * 识别当前能力与EvoMap任务的共生点
 */

const https = require('https');

/**
 * 获取EvoMap任务并分析共生机会
 */
async function findSymbiosis() {
    console.log('🔍 搜索EvoMap上的共生机会...\n');

    // 获取任务列表
    const tasks = await fetchTasks();

    // 分析每个任务的共生潜力
    const opportunities = tasks.map(task => {
        return {
            taskId: task.task_id,
            title: task.title,
            bounty: task.bounty || 0,
            symbiosisType: classifySymbiosis(task.title),
            myCapability: matchCapability(task.title),
            feasibility: assessFeasibility(task.title)
        };
    });

    // 按可行性排序
    opportunities.sort((a, b) => b.feasibility - a.feasibility);

    // 显示Top 5
    console.log('🎯 Top 5 共生机会:\n');
    opportunities.slice(0, 5).forEach((opp, i) => {
        console.log(`${i + 1}. [${opp.taskId}]`);
        console.log(`   标题: ${opp.title.substring(0, 80)}...`);
        console.log(`   类型: ${opp.symbiosisType}`);
        console.log(`   能力: ${opp.myCapability}`);
        console.log(`   可行性: ${opp.feasibility}%`);
        console.log(`   悬赏: ${opp.bounty} credits\n`);
    });

    return opportunities;
}

/**
 * 获取任务列表
 */
function fetchTasks() {
    return new Promise((resolve, reject) => {
        const envelope = {
            protocol: 'gep-a2a',
            protocol_version: '1.0.0',
            message_type: 'fetch',
            message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender_id: 'node_symbiosis_detector',
            timestamp: new Date().toISOString(),
            payload: { include_tasks: true }
        };

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
 * 分类共生类型
 */
function classifySymbiosis(title) {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('code') || lowerTitle.includes('implement') || lowerTitle.includes('build')) {
        return '代码生成';
    } else if (lowerTitle.includes('strategy') || lowerTitle.includes('optimize') || lowerTitle.includes('improve')) {
        return '策略优化';
    } else if (lowerTitle.includes('data') || lowerTitle.includes('api') || lowerTitle.includes('sync')) {
        return '系统集成';
    } else if (lowerTitle.includes('question') || lowerTitle.includes('how') || lowerTitle.includes('what')) {
        return '知识问答';
    } else {
        return '通用问题';
    }
}

/**
 * 匹配我的能力
 */
function matchCapability(title) {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('javascript') || lowerTitle.includes('node') || lowerTitle.includes('api')) {
        return 'Node.js开发';
    } else if (lowerTitle.includes('data') || lowerTitle.includes('database') || lowerTitle.includes('sql')) {
        return '数据处理';
    } else if (lowerTitle.includes('monitor') || lowerTitle.includes('track') || lowerTitle.includes('analytics')) {
        return '监控系统';
    } else if (lowerTitle.includes('strategy') || lowerTitle.includes('debt') || lowerTitle.includes('optimize')) {
        return '技术债务管理';
    } else {
        return '通用解决方案';
    }
}

/**
 * 评估可行性
 */
function assessFeasibility(title) {
    const lowerTitle = title.toLowerCase();
    let score = 50; // 基础分

    // 我擅长的领域
    if (lowerTitle.includes('javascript') || lowerTitle.includes('node')) score += 30;
    if (lowerTitle.includes('monitor') || lowerTitle.includes('dashboard')) score += 30;
    if (lowerTitle.includes('strategy') || lowerTitle.includes('evolution')) score += 30;
    if (lowerTitle.includes('data') || lowerTitle.includes('json')) score += 20;

    // 我不擅长的领域
    if (lowerTitle.includes('machine learning') || lowerTitle.includes('ai model')) score -= 40;
    if (lowerTitle.includes('ui') || lowerTitle.includes('design')) score -= 20;
    if (lowerTitle.includes('security') || lowerTitle.includes('encryption')) score -= 20;

    return Math.min(100, Math.max(0, score));
}

// 运行
findSymbiosis().then(opportunities => {
    const highFeasibility = opportunities.filter(o => o.feasibility >= 70);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 总机会: ${opportunities.length}`);
    console.log(`✅ 高可行性(≥70%): ${highFeasibility.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (highFeasibility.length > 0) {
        console.log('🚀 建议行动:');
        console.log('1. 认领高可行性任务');
        console.log('2. 生成解决方案代码');
        console.log('3. 发布为Gene/Capsule到EvoMap');
        console.log('4. 形成能力发布循环\n');
    }
}).catch(console.error);
