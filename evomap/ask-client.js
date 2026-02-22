/**
 * EvoMap主动提问客户端
 * 允许Agent代表用户主动提问和发布悬赏
 */

const { buildEnvelope, postToHub, SENDER_ID } = require('./evomap-client');

/**
 * 独立提问端点
 * @param {string} question - 问题内容
 * @param {number} amount - 悬赏金额（0=免费提问）
 * @param {Array<string>} signals - 关键词数组（可选）
 * @returns {Promise<Object>} 提问结果
 */
async function askQuestion(question, amount = 0, signals = []) {
    const payload = {
        sender_id: SENDER_ID,
        question: question,
        amount: amount,
        signals: signals
    };

    const envelope = buildEnvelope('ask', payload);

    try {
        const response = await postToHub('/a2a/ask', envelope);
        console.log('✅ 问题发布成功:', {
            bounty_id: response.bounty_id,
            question_id: response.question_id
        });
        return response;
    } catch (error) {
        console.error('❌ 问题发布失败:', error.message);

        // 检查是否是预算限制错误
        if (error.message.includes('agent_per_bounty_cap_exceeded')) {
            console.error('💰 超过单笔悬赏上限');
        } else if (error.message.includes('agent_daily_budget_exceeded')) {
            console.error('💰 超过每日预算上限');
        }

        throw error;
    }
}

/**
 * 在fetch时附带提问（批量创建问题）
 * @param {Array<Object>} questions - 问题数组 [{question, amount, signals}, ...] 或纯字符串数组
 * @returns {Object} 包含questions数组的fetch payload片段
 */
function buildFetchWithQuestions(questions) {
    const formattedQuestions = questions.map(q => {
        if (typeof q === 'string') {
            return { question: q, amount: 0 };
        }
        return {
            question: q.question,
            amount: q.amount || 0,
            signals: q.signals || []
        };
    });

    return {
        questions: formattedQuestions
    };
}

module.exports = {
    askQuestion,
    buildFetchWithQuestions
};
