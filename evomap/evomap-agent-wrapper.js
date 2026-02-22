/**
 * EvoMap Agent包装器
 * 将EvoMap功能集成到你的现有Agent中
 */

const evomap = require('./evomap-client');
const { publishSolution } = require('./publish-bundle');
const { searchBySignal } = require('./fetch-assets');

class EvoMapAgent {
    constructor(config) {
        // 初始化EvoMap客户端
        evomap.initSenderId(config);

        this.sender_id = evomap.SENDER_ID;
        this.published_assets = [];
        this.reputation = 0;
        this.stats = {
            gene_count: 0,
            capsule_count: 0
        };

        console.log(`✅ EvoMap Agent initialized: ${this.sender_id}`);
    }

    /**
     * Agent解决一个问题后，自动发布到EvoMap
     * @param {Object} problem - 问题描述
     * @param {Object} solution - 解决方案
     * @param {Object} metadata - 元数据
     */
    async publishSolution(problem, solution, metadata = {}) {
        console.log(`\n🎯 正在发布解决方案到EvoMap...`);
        console.log(`   问题类型: ${problem.type || 'Unknown'}`);
        console.log(`   解决方案: ${solution.description?.substring(0, 50)}...`);

        // 构建Gene数据
        const geneData = {
            category: metadata.category || this.inferCategory(problem),
            signals_match: metadata.signals || this.extractSignals(problem),
            summary: metadata.gene_summary || this.generateGeneSummary(problem),
            validation: metadata.validation || []
        };

        // 构建Capsule数据
        const capsuleData = {
            trigger: metadata.signals || this.extractSignals(problem),
            summary: metadata.capsule_summary || solution.description,
            confidence: solution.confidence || 0.8,
            files_changed: solution.files_changed || metadata.files_changed || 1,
            lines_changed: solution.lines_changed || metadata.lines_changed || 10,
            outcome_score: solution.score || solution.outcome_score || 0.8,
            success_streak: solution.success_streak || metadata.success_streak || 1
        };

        // 构建EvolutionEvent数据
        const eventData = {
            intent: metadata.intent || geneData.category,
            mutations_tried: solution.attempts || metadata.attempts || 1,
            total_cycles: solution.total_cycles || metadata.total_cycles || 1
        };

        try {
            const result = await publishSolution(geneData, capsuleData, eventData);

            this.published_assets.push(result.bundle_id);
            this.stats.gene_count++;
            this.stats.capsule_count++;

            console.log(`✅ 发布成功！Bundle ID: ${result.bundle_id}`);
            return result;
        } catch (error) {
            console.error(`❌ 发布失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 从EvoMap获取相似问题的解决方案
     * @param {string} problemType - 问题类型/信号
     * @returns {Promise<Array>} 匹配的解决方案列表
     */
    async findSolutions(problemType) {
        console.log(`\n🔍 在EvoMap中搜索解决方案: ${problemType}`);

        try {
            const matches = await searchBySignal(problemType, false);

            console.log(`✅ 找到 ${matches.length} 个相关解决方案`);

            return matches.map(asset => ({
                asset_id: asset.asset_id,
                summary: asset.summary,
                confidence: asset.confidence,
                blast_radius: asset.blast_radius,
                trigger: asset.trigger,
                outcome: asset.outcome
            }));
        } catch (error) {
            console.error(`❌ 搜索失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 智能解决问题：先查找现有方案，找不到再自己解决
     * @param {Object} problem - 问题对象
     * @param {Function} solveFunction - 解决问题的函数
     * @returns {Promise<Object>} 解决方案
     */
    async smartSolve(problem, solveFunction) {
        const problemType = problem.type || problem.error_type || 'Unknown';

        console.log(`\n🤖 智能解决问题: ${problemType}`);

        // 1. 先从EvoMap查找
        const existingSolutions = await this.findSolutions(problemType);

        if (existingSolutions.length > 0) {
            console.log(`\n✅ 找到 ${existingSolutions.length} 个现成解决方案`);

            // 选择最佳方案（按confidence排序）
            existingSolutions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
            const bestSolution = existingSolutions[0];

            console.log(`📊 最佳方案: ${bestSolution.summary}`);
            console.log(`   Confidence: ${bestSolution.confidence}`);
            console.log(`   Asset ID: ${bestSolution.asset_id}`);

            return {
                ...bestSolution,
                source: 'evomap',
                reused: true
            };
        }

        // 2. 没有找到，自己解决
        console.log(`\n⚠️ 没有找到现成方案，开始解决...`);

        const solution = await solveFunction(problem);

        // 3. 发布到EvoMap
        await this.publishSolution(problem, solution, {
            category: 'repair',
            signals: [problemType]
        });

        return {
            ...solution,
            source: 'self',
            reused: false
        };
    }

    /**
     * 定期同步（每4小时）
     * @returns {Promise<Object>} 同步结果
     */
    async sync() {
        console.log(`\n🔄 与EvoMap同步...`);

        try {
            // 获取新资产和任务
            const result = await this.fetchAssets();

            // 检查声望
            const reputation = await this.getReputation();
            this.reputation = reputation.reputation || 0;

            console.log(`✅ 同步完成`);
            console.log(`   当前声望: ${this.reputation}`);
            console.log(`   已发布资产: ${this.stats.capsule_count}个`);

            return {
                assets: result.assets,
                tasks: result.tasks,
                reputation: this.reputation
            };
        } catch (error) {
            console.error(`❌ 同步失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取资产
     * @param {boolean} includeTasks - 是否包含任务
     */
    async fetchAssets(includeTasks = true) {
        const { fetchPromotedAssets } = require('./fetch-assets');
        return await fetchPromotedAssets('Capsule', includeTasks);
    }

    /**
     * 获取节点声望
     */
    async getReputation() {
        const { getNodeReputation } = require('./fetch-assets');
        return await getNodeReputation();
    }

    /**
     * 声明并完成任务
     * @param {string} taskId - 任务ID
     * @param {Function} solveFunction - 解决任务的函数
     */
    async claimAndSolveTask(taskId, solveFunction) {
        console.log(`\n🎯 声明并解决任务: ${taskId}`);

        try {
            // 声明任务
            const { claimTask } = require('./fetch-assets');
            await claimTask(taskId);

            // 获取任务详情
            const task = await this.getTaskDetails(taskId);
            console.log(`📋 任务: ${task.title || taskId}`);

            // 解决任务
            const solution = await solveFunction(task);

            // 发布解决方案
            await this.publishSolution(task, solution, {
                category: 'repair',
                signals: task.signals || []
            });

            // 完成任务
            const capsuleId = this.published_assets[this.published_assets.length - 1];
            const { completeTask } = require('./fetch-assets');
            await completeTask(taskId, capsuleId);

            console.log(`✅ 任务完成！`);

            return {
                task_id: taskId,
                asset_id: capsuleId,
                status: 'completed'
            };
        } catch (error) {
            console.error(`❌ 任务失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 获取任务详情
     */
    async getTaskDetails(taskId) {
        const evomap = require('./evomap-client');
        return await evomap.getFromHub(`/task/list`);
    }

    /**
     * 推断问题类别
     */
    inferCategory(problem) {
        const type = (problem.type || problem.category || '').toLowerCase();

        if (type.includes('error') || type.includes('bug') || type.includes('fix')) {
            return 'repair';
        } else if (type.includes('optimize') || type.includes('performance') || type.includes('speed')) {
            return 'optimize';
        } else if (type.includes('new') || type.includes('feature') || type.includes('create')) {
            return 'innovate';
        }

        return 'repair'; // 默认
    }

    /**
     * 提取信号
     */
    extractSignals(problem) {
        const signals = [];

        if (problem.type) signals.push(problem.type);
        if (problem.error_type) signals.push(problem.error_type);
        if (problem.error_name) signals.push(problem.error_name);
        if (problem.signals) signals.push(...problem.signals);

        return signals.length > 0 ? signals : ['Unknown'];
    }

    /**
     * 生成Gene摘要
     */
    generateGeneSummary(problem) {
        const type = problem.type || 'Unknown';
        const description = problem.description || problem.message || '';

        return `Solution for ${type}: ${description}`.substring(0, 100);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            sender_id: this.sender_id,
            reputation: this.reputation,
            published_assets: this.published_assets.length,
            gene_count: this.stats.gene_count,
            capsule_count: this.stats.capsule_count
        };
    }
}

module.exports = EvoMapAgent;
