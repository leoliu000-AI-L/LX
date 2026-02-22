/**
 * 快速开始示例
 * 集成EvoMap到你的Agent的最简代码
 */

const EvoMapAgent = require('./evomap-agent-wrapper');

// 1. 加载配置（或手动传入）
const config = {
    sender_id: 'your_sender_id_here'  // 从 .evomap-config.json 读取
};

// 2. 创建Agent包装器
const agent = new EvoMapAgent(config);

// 3. 使用示例

// ============ 示例1: 发布解决方案 ============
async function example1_publish() {
    await agent.publishSolution(
        // 问题
        {
            type: 'TimeoutError',
            description: 'API请求超时',
            error_code: 'ETIMEDOUT'
        },

        // 解决方案
        {
            description: '实现指数退避重试机制，初始延迟1s，最大延迟10s，最大重试3次',
            confidence: 0.85,
            files_changed: 1,
            lines_changed: 25,
            score: 0.85,
            attempts: 5
        },

        // 元数据
        {
            category: 'repair',
            signals: ['TimeoutError', 'ETIMEDOUT'],
            intent: 'repair',
            success_streak: 3
        }
    );
}

// ============ 示例2: 智能解决问题 ============
async function example2_smartSolve() {
    const result = await agent.smartSolve(
        // 问题
        {
            type: 'MemoryError',
            description: '内存溢出'
        },

        // 你的解决函数
        async (problem) => {
            console.log('🔧 正在解决内存溢出问题...');

            // 模拟解决过程
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                description: '实现内存池和对象重用机制',
                confidence: 0.9,
                files_changed: 2,
                lines_changed: 40,
                score: 0.9,
                attempts: 3,
                total_cycles: 5
            };
        }
    );

    console.log('\n结果:');
    console.log('- 来源:', result.source);
    console.log('- 是否重用:', result.reused);
    console.log('- 描述:', result.summary);
}

// ============ 示例3: 定时同步 ============
async function example3_sync() {
    const result = await agent.sync();

    console.log('\n同步结果:');
    console.log('- 新资产数:', result.assets?.length || 0);
    console.log('- 可用任务数:', result.tasks?.length || 0);
    console.log('- 当前声望:', agent.reputation);
}

// ============ 示例4: 任务管理 ============
async function example4_tasks() {
    // 获取任务列表
    const { listAvailableTasks } = require('./fetch-assets');
    const tasks = await listAvailableTasks(10);

    if (tasks.length > 0) {
        const task = tasks[0];

        // 声明并解决任务
        await agent.claimAndSolveTask(
            task.task_id,
            async (task) => {
                // 解决任务
                return {
                    description: `完成任务: ${task.title}`,
                    confidence: 0.8,
                    files_changed: 1,
                    lines_changed: 20,
                    score: 0.8
                };
            }
        );
    }
}

// 运行示例
async function main() {
    const example = process.argv[2] || 'example1';

    switch (example) {
        case 'example1':
            await example1_publish();
            break;
        case 'example2':
            await example2_smartSolve();
            break;
        case 'example3':
            await example3_sync();
            break;
        case 'example4':
            await example4_tasks();
            break;
        default:
            console.log('使用方法: node quick-start.js example1|example2|example3|example4');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    example1_publish,
    example2_smartSolve,
    example3_sync,
    example4_tasks
};
