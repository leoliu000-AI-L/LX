/**
 * 发布Gene + Capsule Bundle到EvoMap
 */

const evomap = require('./evomap-client');

/**
 * 发布解决方案到EvoMap
 * @param {Object} geneData - Gene数据
 * @param {Object} capsuleData - Capsule数据
 * @param {Object} eventData - EvolutionEvent数据（可选但推荐）
 */
async function publishSolution(geneData, capsuleData, eventData = null) {
    console.log('🎯 正在发布解决方案到EvoMap...\n');

    // 验证输入
    if (!evomap.SENDER_ID) {
        throw new Error('请先调用 initSenderId() 初始化客户端');
    }

    // ========== 1. 构建Gene对象 ==========
    console.log('📦 构建Gene对象...');
    const gene = {
        type: 'Gene',
        schema_version: '1.5.0',
        category: geneData.category || 'repair',  // repair | optimize | innovate
        signals_match: geneData.signals_match || [],
        summary: geneData.summary || '',
        validation: geneData.validation || []
    };

    // 验证必需字段
    if (!['repair', 'optimize', 'innovate'].includes(gene.category)) {
        throw new Error('Gene.category必须是 repair、optimize 或 innovate');
    }
    if (!Array.isArray(gene.signals_match) || gene.signals_match.length === 0) {
        throw new Error('Gene.signals_match必须是非空数组');
    }
    if (gene.summary.length < 10) {
        throw new Error('Gene.summary最少需要10个字符');
    }

    // 计算Gene的asset_id
    gene.asset_id = evomap.computeAssetId(gene);
    console.log('✅ Gene asset_id:', gene.asset_id);

    // ========== 2. 构建Capsule对象 ==========
    console.log('📦 构建Capsule对象...');
    const capsule = {
        type: 'Capsule',
        schema_version: '1.5.0',
        trigger: capsuleData.trigger || [],
        gene: gene.asset_id,  // 引用Gene的asset_id
        summary: capsuleData.summary || '',
        confidence: capsuleData.confidence || 0.8,
        blast_radius: {
            files: capsuleData.files_changed || 1,
            lines: capsuleData.lines_changed || 10
        },
        outcome: {
            status: 'success',
            score: capsuleData.outcome_score || 0.8
        },
        env_fingerprint: {
            platform: process.platform,
            arch: process.arch
        },
        success_streak: capsuleData.success_streak || 1
    };

    // 验证必需字段
    if (!Array.isArray(capsule.trigger) || capsule.trigger.length === 0) {
        throw new Error('Capsule.trigger必须是非空数组');
    }
    if (capsule.summary.length < 20) {
        throw new Error('Capsule.summary最少需要20个字符');
    }
    if (capsule.confidence < 0 || capsule.confidence > 1) {
        throw new Error('Capsule.confidence必须在0-1之间');
    }
    if (capsule.blast_radius.files < 1 || capsule.blast_radius.lines < 1) {
        throw new Error('Capsule.blast_radius.files和lines必须大于0');
    }
    if (capsule.outcome.score < 0.7) {
        console.warn('⚠️  警告: outcome.score低于0.7，可能不符合发布条件');
    }

    // 计算Capsule的asset_id
    capsule.asset_id = evomap.computeAssetId(capsule);
    console.log('✅ Capsule asset_id:', capsule.asset_id);

    // ========== 3. 构建EvolutionEvent对象（可选但推荐）==========
    let event = null;
    if (eventData) {
        console.log('📦 构建EvolutionEvent对象...');
        event = {
            type: 'EvolutionEvent',
            intent: eventData.intent || 'repair',
            capsule_id: capsule.asset_id,
            genes_used: [gene.asset_id],
            outcome: capsule.outcome,
            mutations_tried: eventData.mutations_tried || 1,
            total_cycles: eventData.total_cycles || 1
        };

        event.asset_id = evomap.computeAssetId(event);
        console.log('✅ EvolutionEvent asset_id:', event.asset_id);
    } else {
        console.log('⚠️  跳过EvolutionEvent（建议包含以获得更高的GDI评分）');
    }

    // ========== 4. 构建资产数组 ==========
    const assets = [gene, capsule];
    if (event) {
        assets.push(event);
    }

    console.log('\n📋 Bundle摘要:');
    console.log('  - Gene:', gene.summary);
    console.log('  - Capsule:', capsule.summary);
    console.log('  - EvolutionEvent:', event ? event.intent : '(未包含)');
    console.log('');

    // ========== 5. 构建并发送publish消息 ==========
    const payload = {
        assets: assets  // 注意：必须是assets（复数）数组
    };

    const envelope = evomap.buildEnvelope('publish', payload);

    try {
        console.log('📤 正在发送到EvoMap Hub...');
        const response = await evomap.postToHub('/a2a/publish', envelope);

        console.log('\n✅ 资产发布成功！\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 发布结果:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Bundle ID:', response.bundle_id);
        console.log('Status:', response.status);
        console.log('Message:', response.message || '资产已提交审核');

        if (response.status === 'candidate') {
            console.log('\n📌 状态说明: candidate');
            console.log('  您的资产已成功提交，正在等待验证和推广');
            console.log('  通常需要几分钟到几小时的时间');
        } else if (response.status === 'promoted') {
            console.log('\n🎉 状态说明: promoted');
            console.log('  您的资产已通过验证并推广，其他Agent可以看到并使用！');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return response;
    } catch (error) {
        console.error('\n❌ 发布失败:', error.message);

        if (error.message.includes('bundle_required')) {
            console.error('\n💡 提示: 必须同时发布Gene和Capsule（使用assets数组）');
        } else if (error.message.includes('asset_id mismatch')) {
            console.error('\n💡 提示: SHA256哈希不匹配，请检查computeAssetId函数');
        } else if (error.message.includes('summary too short')) {
            console.error('\n💡 提示: Gene.summary需要≥10个字符，Capsule.summary需要≥20个字符');
        }

        throw error;
    }
}

/**
 * 快速发布模板：Bug修复
 */
async function publishBugFix(bugType, fixDescription, metadata = {}) {
    const geneData = {
        category: 'repair',
        signals_match: [bugType],
        summary: `Fix for ${bugType}: ${fixDescription.substring(0, 50)}...`,
        validation: metadata.validation || []
    };

    const capsuleData = {
        trigger: [bugType],
        summary: fixDescription,
        confidence: metadata.confidence || 0.8,
        files_changed: metadata.files_changed || 1,
        lines_changed: metadata.lines_changed || 10,
        outcome_score: metadata.outcome_score || 0.8,
        success_streak: metadata.success_streak || 1
    };

    const eventData = {
        intent: 'repair',
        mutations_tried: metadata.attempts || 1,
        total_cycles: metadata.attempts || 1
    };

    return await publishSolution(geneData, capsuleData, eventData);
}

/**
 * 快速发布模板：性能优化
 */
async function publishOptimization(target, improvementDescription, metadata = {}) {
    const geneData = {
        category: 'optimize',
        signals_match: ['Performance', target],
        summary: `Optimize ${target}: ${improvementDescription.substring(0, 50)}...`,
        validation: metadata.validation || []
    };

    const capsuleData = {
        trigger: ['Performance'],
        summary: improvementDescription,
        confidence: metadata.confidence || 0.85,
        files_changed: metadata.files_changed || 1,
        lines_changed: metadata.lines_changed || 15,
        outcome_score: metadata.outcome_score || 0.85,
        success_streak: metadata.success_streak || 1
    };

    const eventData = {
        intent: 'optimize',
        mutations_tried: metadata.attempts || 3,
        total_cycles: metadata.attempts || 5
    };

    return await publishSolution(geneData, capsuleData, eventData);
}

module.exports = {
    publishSolution,
    publishBugFix,
    publishOptimization
};
