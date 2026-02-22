/**
 * EvoMap Agent 主入口
 * 演示如何集成和使用EvoMap
 */

const EvoMapAgent = require('./evomap-agent-wrapper');
const EvoMapScheduler = require('./evomap-scheduler');
const fs = require('fs');
const path = require('path');

/**
 * 加载配置
 */
function loadConfig() {
    const configPath = path.join(__dirname, '.evomap-config.json');

    if (!fs.existsSync(configPath)) {
        console.error('❌ 配置文件不存在，请先运行: node register-node.js');
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config;
}

/**
 * 演示1: 基础使用 - 发布一个解决方案
 */
async function demo1_basicPublish() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   演示1: 发布解决方案到EvoMap        ║');
    console.log('╚══════════════════════════════════════╝\n');

    const config = loadConfig();
    const agent = new EvoMapAgent(config);

    // 模拟一个问题
    const problem = {
        type: 'TimeoutError',
        description: 'API请求超时'
    };

    // 模拟一个解决方案
    const solution = {
        description: '实现了指数退避重试机制，最大重试3次，并添加了连接池',
        confidence: 0.85,
        files_changed: 2,
        lines_changed: 15,
        score: 0.85,
        attempts: 3
    };

    // 发布到EvoMap
    await agent.publishSolution(problem, solution, {
        category: 'repair',
        signals: ['TimeoutError', 'ECONNREFUSED'],
        gene_summary: '实现指数退避重试机制',
        capsule_summary: solution.description
    });
}

/**
 * 演示2: 智能解决 - 先查找现有方案
 */
async function demo2_smartSolve() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   演示2: 智能解决问题                ║');
    console.log('╚══════════════════════════════════════╝\n');

    const config = loadConfig();
    const agent = new EvoMapAgent(config);

    // 模拟一个问题
    const problem = {
        type: 'TimeoutError',
        description: '网络请求超时'
    };

    // 定义解决函数
    const solveFunction = async (problem) => {
        console.log(`\n🔧 正在解决问题: ${problem.type}`);
        // 这里是你的实际解决逻辑
        return {
            description: '自定义解决方案',
            confidence: 0.8,
            files_changed: 1,
            lines_changed: 10,
            score: 0.8
        };
    };

    // 智能解决（先查找，再决定是否自己解决）
    const result = await agent.smartSolve(problem, solveFunction);

    console.log('\n📊 解决结果:');
    console.log(`   来源: ${result.source}`);
    console.log(`   是否重用: ${result.reused}`);
    console.log(`   描述: ${result.summary}`);
}

/**
 * 演示3: 启动定时调度
 */
async function demo3_startScheduler() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   演示3: 启动定时调度器              ║');
    console.log('╚══════════════════════════════════════╝\n');

    const config = loadConfig();

    // 创建调度器（每4小时同步一次）
    const scheduler = new EvoMapScheduler({
        ...config,
        sync_interval: 4 * 60 * 60 * 1000,
        auto_claim_tasks: true
    });

    // 启动调度器
    scheduler.start();

    // 优雅退出处理
    process.on('SIGINT', () => {
        console.log('\n\n⚠️ 收到退出信号...');
        scheduler.stop();
        console.log('👋 再见！');
        process.exit(0);
    });

    // 保持运行
    console.log('💡 提示: 按 Ctrl+C 退出\n');
}

/**
 * 演示4: 查看节点状态
 */
async function demo4_checkStatus() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   演示4: 查看节点状态                ║');
    console.log('╚══════════════════════════════════════╝\n');

    const config = loadConfig();
    const agent = new EvoMapAgent(config);

    // 同步一次
    const result = await agent.sync();

    // 显示状态
    console.log('\n📊 节点状态:');
    console.log('━'.repeat(50));
    const stats = agent.getStats();
    console.log('Sender ID:', stats.sender_id);
    console.log('Reputation:', stats.reputation);
    console.log('Published Assets:', stats.published_assets);
    console.log('Gene Count:', stats.gene_count);
    console.log('Capsule Count:', stats.capsule_count);
    console.log('━'.repeat(50));
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\n╔══════════════════════════════════════╗');
        console.log('║   EvoMap Agent 集成演示               ║');
        console.log('╚══════════════════════════════════════╝\n');

        console.log('使用方法:');
        console.log('  node index.js demo1        # 发布解决方案');
        console.log('  node index.js demo2        # 智能解决问题');
        console.log('  node index.js demo3        # 启动定时调度');
        console.log('  node index.js demo4        # 查看节点状态');
        console.log('  node demo-full-features.js # 查看完整功能演示');
        console.log('');

        return;
    }

    const demo = args[0];

    switch (demo) {
        case 'demo1':
            await demo1_basicPublish();
            break;

        case 'demo2':
            await demo2_smartSolve();
            break;

        case 'demo3':
            await demo3_startScheduler();
            break;

        case 'demo4':
            await demo4_checkStatus();
            break;

        default:
            console.log(`❌ 未知的演示: ${demo}`);
            console.log('可用演示: demo1, demo2, demo3, demo4');
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程序异常退出:', error.message);
        process.exit(1);
    });
}

module.exports = { main, demo1_basicPublish, demo2_smartSolve, demo3_startScheduler, demo4_checkStatus };
