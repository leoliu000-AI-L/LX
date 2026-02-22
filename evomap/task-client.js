/**
 * EvoMap任务系统客户端
 * 处理任务认领、完成、蜂群智能等功能
 */

const { buildEnvelope, postToHub, getFromHub, SENDER_ID } = require('./evomap-client');

/**
 * 获取任务列表
 * @param {Object} filters - 过滤条件（可选）
 * @returns {Promise<Object>} 任务列表
 */
async function listTasks(filters = {}) {
    try {
        const response = await getFromHub('/a2a/task/list');
        return response;
    } catch (error) {
        console.error('❌ 获取任务列表失败:', error.message);
        throw error;
    }
}

/**
 * 认领任务
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 认领结果
 */
async function claimTask(taskId) {
    const payload = {
        task_id: taskId,
        node_id: SENDER_ID
    };

    const envelope = buildEnvelope('task_claim', payload);

    try {
        const response = await postToHub('/a2a/task/claim', envelope);
        console.log('✅ 任务认领成功:', response);
        return response;
    } catch (error) {
        console.error('❌ 任务认领失败:', error.message);
        throw error;
    }
}

/**
 * 完成任务
 * @param {string} taskId - 任务ID
 * @param {string} assetId - 解决方案的asset_id
 * @param {string} followupQuestion - 可选的追问
 * @returns {Promise<Object>} 完成结果
 */
async function completeTask(taskId, assetId, followupQuestion = null) {
    const payload = {
        task_id: taskId,
        asset_id: assetId,
        node_id: SENDER_ID
    };

    if (followupQuestion) {
        payload.followup_question = followupQuestion;
    }

    const envelope = buildEnvelope('task_complete', payload);

    try {
        const response = await postToHub('/a2a/task/complete', envelope);
        console.log('✅ 任务完成提交成功:', response);
        return response;
    } catch (error) {
        console.error('❌ 任务完成失败:', error.message);
        throw error;
    }
}

/**
 * 查询我认领的任务
 * @returns {Promise<Object>} 我的任务列表
 */
async function getMyTasks() {
    try {
        const response = await getFromHub(`/a2a/task/my?node_id=${SENDER_ID}`);
        return response;
    } catch (error) {
        console.error('❌ 获取我的任务失败:', error.message);
        throw error;
    }
}

/**
 * 提议蜂群任务分解
 * @param {string} taskId - 父任务ID
 * @param {Array} subtasks - 子任务列表 [{title, body, weight}, ...]
 * @returns {Promise<Object>} 分解结果
 */
async function proposeDecomposition(taskId, subtasks) {
    const totalWeight = subtasks.reduce((sum, st) => sum + st.weight, 0);

    if (totalWeight > 0.85) {
        throw new Error(`子任务权重之和 (${totalWeight}) 超过 0.85 限制`);
    }

    const payload = {
        task_id: taskId,
        node_id: SENDER_ID,
        subtasks: subtasks
    };

    const envelope = buildEnvelope('task_decompose', payload);

    try {
        const response = await postToHub('/a2a/task/propose-decomposition', envelope);
        console.log('✅ 蜂群分解提议成功:', response);
        return response;
    } catch (error) {
        console.error('❌ 蜂群分解提议失败:', error.message);
        throw error;
    }
}

/**
 * 查询蜂群状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 蜂群状态
 */
async function getSwarmStatus(taskId) {
    try {
        const response = await getFromHub(`/a2a/task/swarm/${taskId}`);
        return response;
    } catch (error) {
        console.error('❌ 获取蜂群状态失败:', error.message);
        throw error;
    }
}

module.exports = {
    listTasks,
    claimTask,
    completeTask,
    getMyTasks,
    proposeDecomposition,
    getSwarmStatus
};
