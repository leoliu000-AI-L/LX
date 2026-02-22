/**
 * 从EvoMap获取资产和任务
 */

const evomap = require('./evomap-client');

/**
 * 获取promoted资产
 * @param {string} assetType - 资产类型 ('Gene' | 'Capsule' | null)
 * @param {boolean} includeTasks - 是否包含任务
 * @returns {Promise<Object>} Hub响应
 */
async function fetchPromotedAssets(assetType = 'Capsule', includeTasks = false) {
    console.log(`🔍 正在从EvoMap获取${assetType || '所有'}资产...\n`);

    const payload = {
        asset_type: assetType,  // 'Gene' | 'Capsule' | null
        local_id: null,
        content_hash: null
    };

    if (includeTasks) {
        payload.include_tasks = true;
    }

    const envelope = evomap.buildEnvelope('fetch', payload);

    try {
        const response = await evomap.postToHub('/a2a/fetch', envelope);

        const assetCount = response.assets?.length || 0;
        const taskCount = response.tasks?.length || 0;

        console.log(`✅ 获取成功！`);
        console.log(`   - 资产: ${assetCount}个`);
        if (includeTasks) {
            console.log(`   - 任务: ${taskCount}个`);
        }
        console.log('');

        return response;
    } catch (error) {
        console.error('❌ 获取失败:', error.message);
        throw error;
    }
}

/**
 * 搜索匹配特定信号的资产
 * @param {string} signal - 信号类型（如 'TimeoutError'）
 * @param {boolean} includeTasks - 是否包含任务
 * @returns {Promise<Array>} 匹配的资产列表
 */
async function searchBySignal(signal, includeTasks = false) {
    console.log(`🔍 搜索信号: ${signal}\n`);

    const result = await fetchPromotedAssets('Capsule', includeTasks);

    // 过滤匹配的资产
    const matches = result.assets?.filter(asset => {
        return asset.trigger && asset.trigger.some(t =>
            t.toLowerCase().includes(signal.toLowerCase())
        );
    }) || [];

    console.log(`✅ 找到 ${matches.length} 个相关资产\n`);

    return matches;
}

/**
 * 获取节点声望信息
 * @returns {Promise<Object>} 节点信息
 */
async function getNodeReputation() {
    console.log('📊 获取节点声望信息...\n');

    if (!evomap.SENDER_ID) {
        throw new Error('请先初始化客户端');
    }

    try {
        const response = await evomap.getFromHub(`/a2a/nodes/${evomap.SENDER_ID}`);

        console.log('✅ 节点信息:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Sender ID:', response.sender_id);
        console.log('Reputation:', response.reputation || 'N/A');
        console.log('Gene Count:', response.gene_count || 0);
        console.log('Capsule Count:', response.capsule_count || 0);
        console.log('Status:', response.status || 'active');
        console.log('Created At:', response.created_at || 'N/A');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return response;
    } catch (error) {
        console.error('❌ 获取声望失败:', error.message);
        throw error;
    }
}

/**
 * 获取Hub统计信息
 * @returns {Promise<Object>} Hub统计
 */
async function getHubStats() {
    console.log('📊 获取Hub统计信息...\n');

    try {
        const response = await evomap.getFromHub('/a2a/stats');

        console.log('✅ Hub统计:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('总节点数:', response.total_nodes || 0);
        console.log('总资产数:', response.total_assets || 0);
        console.log('Promoted资产数:', response.promoted_assets || 0);
        console.log('候选资产数:', response.candidate_assets || 0);
        console.log('活跃任务数:', response.active_tasks || 0);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return response;
    } catch (error) {
        console.error('❌ 获取统计失败:', error.message);
        throw error;
    }
}

/**
 * 列出可用任务
 * @param {number} limit - 最多返回多少个任务
 * @returns {Promise<Array>} 任务列表
 */
async function listAvailableTasks(limit = 10) {
    console.log(`📋 列出可用任务（最多${limit}个）...\n`);

    try {
        const response = await evomap.getFromHub(`/task/list?limit=${limit}`);

        const tasks = response.tasks || [];

        console.log(`✅ 找到 ${tasks.length} 个可用任务\n`);

        if (tasks.length > 0) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            tasks.forEach((task, index) => {
                console.log(`${index + 1}. ${task.title || 'Untitled Task'}`);
                console.log(`   Task ID: ${task.task_id}`);
                console.log(`   Bounty: $${task.bounty_amount || 'N/A'}`);
                console.log(`   Min Reputation: ${task.min_reputation || 0}`);
                console.log(`   Status: ${task.status}`);
                console.log('');
            });
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        return tasks;
    } catch (error) {
        console.error('❌ 获取任务列表失败:', error.message);
        throw error;
    }
}

/**
 * 声明任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 声明结果
 */
async function claimTask(taskId) {
    console.log(`🎯 声明任务: ${taskId}\n`);

    if (!evomap.SENDER_ID) {
        throw new Error('请先初始化客户端');
    }

    try {
        const response = await evomap.postToHub('/task/claim', {
            task_id: taskId,
            node_id: evomap.SENDER_ID
        });

        console.log('✅ 任务声明成功！');
        console.log('Task ID:', response.task_id);
        console.log('Status:', response.status);
        console.log('');

        return response;
    } catch (error) {
        console.error('❌ 声明任务失败:', error.message);

        if (error.message.includes('reputation')) {
            console.error('\n💡 提示: 你的声望分数不足以声明此任务');
        }

        throw error;
    }
}

/**
 * 完成任务
 * @param {string} taskId - 任务ID
 * @param {string} assetId - 解决方案的asset_id
 * @returns {Promise<Object>} 完成结果
 */
async function completeTask(taskId, assetId) {
    console.log(`✅ 完成任务: ${taskId}\n`);

    if (!evomap.SENDER_ID) {
        throw new Error('请先初始化客户端');
    }

    try {
        const response = await evomap.postToHub('/task/complete', {
            task_id: taskId,
            asset_id: assetId,
            node_id: evomap.SENDER_ID
        });

        console.log('✅ 任务完成！');
        console.log('Task ID:', response.task_id);
        console.log('Status:', response.status);
        console.log('');

        return response;
    } catch (error) {
        console.error('❌ 完成任务失败:', error.message);
        throw error;
    }
}

module.exports = {
    fetchPromotedAssets,
    searchBySignal,
    getNodeReputation,
    getHubStats,
    listAvailableTasks,
    claimTask,
    completeTask
};
