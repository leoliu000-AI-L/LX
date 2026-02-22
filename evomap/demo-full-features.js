/**
 * EvoMap完整功能演示
 * 展示任务系统、提问功能、蜂群智能等
 */

const { initSenderId } = require('./evomap-client');
const { listTasks, claimTask, completeTask, proposeDecomposition, getSwarmStatus } = require('./task-client');
const { askQuestion, buildFetchWithQuestions } = require('./ask-client');
const fs = require('fs');

// 加载配置
const configPath = './.evomap-config.json';
if (!fs.existsSync(configPath)) {
    console.error('❌ 配置文件不存在，请先运行 node register-node.js');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
initSenderId(config);

console.log('\n╔══════════════════════════════════════╗');
console.log('║   EvoMap 完整功能演示               ║');
console.log('╚══════════════════════════════════════╝\n');

async function demo1_TaskFlow() {
    console.log('📋 演示1: 任务认领和完成流程');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // 1. 获取可用任务
        console.log('🔍 获取可用任务...');
        const tasks = await listTasks();
        console.log('✅ 当前可用任务数:', tasks.tasks?.length || 0);

        if (tasks.tasks && tasks.tasks.length > 0) {
            const firstTask = tasks.tasks[0];
            console.log('📌 第一个任务:', {
                id: firstTask.task_id,
                title: firstTask.title,
                bounty: firstTask.bounty
            });

            // 2. 认领任务
            console.log('\n🤝 认领任务...');
            const claimResult = await claimTask(firstTask.task_id);
            console.log('✅ 认领成功');

            // 3. 完成任务（需要先发布Capsule，这里用示例asset_id）
            console.log('\n✅ 提交任务完成...');
            const completeResult = await completeTask(
                firstTask.task_id,
                'sha256:example_asset_id_placeholder',
                '这个方案是否能处理边缘情况？' // 追问示例
            );
            console.log('✅ 完成提交成功');
        } else {
            console.log('ℹ️  当前没有可用任务');
        }
    } catch (error) {
        console.error('❌ 任务流程演示失败:', error.message);
    }
}

async function demo2_SwarmIntelligence() {
    console.log('\n\n🐝 演示2: 蜂群智能（任务分解）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        const subtasks = [
            {
                title: '数据预处理模块',
                body: '实现数据清洗、归一化和特征提取',
                weight: 0.30
            },
            {
                title: '核心算法实现',
                body: '实现主要优化算法和迭代逻辑',
                weight: 0.35
            },
            {
                title: '结果验证与可视化',
                body: '验证结果准确性并生成可视化报告',
                weight: 0.20
            }
        ];

        const totalWeight = subtasks.reduce((sum, st) => sum + st.weight, 0);
        console.log('📊 子任务权重总和:', totalWeight, '(≤ 0.85 ✅)');

        console.log('\n🔄 提议任务分解...');
        const result = await proposeDecomposition('parent_task_id_placeholder', subtasks);
        console.log('✅ 分解提议已提交');
    } catch (error) {
        console.error('❌ 蜂群演示失败:', error.message);
    }
}

async function demo3_AskQuestion() {
    console.log('\n\n❓ 演示3: 主动提问功能');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // 免费提问
        console.log('🗣️  发布免费问题...');
        const result1 = await askQuestion(
            'Python中如何实现高效的内存缓存？',
            0,
            ['python', 'cache', 'memory']
        );
        console.log('✅ 问题ID:', result1.question_id);

        // 付费提问（需要账户开启功能和足够预算）
        console.log('\n💰 发布悬赏问题（需要账户授权）...');
        const result2 = await askQuestion(
            '如何优化深度学习模型的推理速度？',
            100, // 100 credits悬赏
            ['deep-learning', 'optimization', 'inference']
        );
        console.log('✅ 悬赏ID:', result2.bounty_id);
    } catch (error) {
        console.error('❌ 提问演示失败:', error.message);
    }
}

async function demo4_FetchWithQuestions() {
    console.log('\n\n🔄 演示4: Fetch时附带提问');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 构建包含问题的fetch payload
    const questionsPayload = buildFetchWithQuestions([
        { question: 'Node.js连接池最佳实践？', amount: 0, signals: ['connection-pool', 'nodejs'] },
        { question: 'TypeScript泛型约束用法？', amount: 0, signals: ['typescript', 'generics'] },
        '简单字符串问题（免费提问）'
    ]);

    const fetchPayload = {
        asset_type: 'Capsule',
        include_tasks: true,
        ...questionsPayload
    };

    console.log('📦 Fetch Payload结构:');
    console.log(JSON.stringify(fetchPayload, null, 2));
    console.log('\n✅ 这个payload可用于 /a2a/fetch 端点');
}

async function demo5_MyTasks() {
    console.log('\n\n📝 演示5: 查询我的任务');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        console.log('🔍 获取我认领的任务...');
        const myTasks = await getMyTasks();
        console.log('✅ 我的任务数:', myTasks.tasks?.length || 0);

        if (myTasks.tasks && myTasks.tasks.length > 0) {
            console.log('📋 任务列表:');
            myTasks.tasks.forEach((task, idx) => {
                console.log(`   ${idx + 1}. ${task.title} (${task.status})`);
            });
        }
    } catch (error) {
        console.error('❌ 查询我的任务失败:', error.message);
    }
}

async function demo6_SwarmStatus() {
    console.log('\n\n📊 演示6: 查询蜂群状态');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        console.log('🔍 查询蜂群任务状态...');
        const status = await getSwarmStatus('example_task_id');
        console.log('✅ 蜂群状态:', status);
    } catch (error) {
        console.error('ℹ️  (示例任务ID，实际使用时替换为真实task_id)');
    }
}

// 运行所有演示
async function runAllDemos() {
    await demo1_TaskFlow();
    await demo2_SwarmIntelligence();
    await demo3_AskQuestion();
    await demo4_FetchWithQuestions();
    await demo5_MyTasks();
    await demo6_SwarmStatus();

    console.log('\n\n╔══════════════════════════════════════╗');
    console.log('║   演示完成                           ║');
    console.log('╚══════════════════════════════════════╝\n');

    console.log('📖 使用说明:');
    console.log('1. 任务系统: 认领任务 -> 解决问题 -> 发布Capsule -> 完成任务');
    console.log('2. 蜂群智能: 分解复杂任务为子任务，多Agent并行求解');
    console.log('3. 主动提问: Agent可代表用户发布悬赏（需账户授权）');
    console.log('4. Fetch+提问: 在常规fetch时批量创建问题');
}

runAllDemos().catch(console.error);
