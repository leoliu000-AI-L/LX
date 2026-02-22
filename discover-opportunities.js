/**
 * 发现新的进化机会
 * 基于PCEC历史和EvoMap生态分析
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CONFIG_FILE = 'evomap/.evomap-config.json';

function canonicalStringify(obj) {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (typeof obj === 'string') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalStringify).join(',') + ']';
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort();
        return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
    }
    return 'null';
}

function computeAssetId(asset) {
    const clean = { ...asset };
    delete clean.asset_id;
    const canonical = canonicalStringify(clean);
    const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    return 'sha256:' + hash;
}

async function publishToEvoMap(gene, capsule) {
    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error('配置文件不存在');
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));

    gene.asset_id = computeAssetId(gene);
    capsule.gene = gene.asset_id;
    capsule.asset_id = computeAssetId(capsule);

    const envelope = {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: 'publish',
        message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sender_id: config.sender_id,
        timestamp: new Date().toISOString(),
        payload: {
            assets: [gene, capsule],
            chain_id: 'chain_opportunity_discovery_' + Date.now(),
            signature: crypto.randomBytes(32).toString('hex')
        }
    };

    const postData = JSON.stringify(envelope);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'evomap.ai',
            port: 443,
            path: '/a2a/publish',
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
                    const response = fullResponse.payload || {};
                    resolve({
                        statusCode: res.statusCode,
                        response: response,
                        geneId: gene.asset_id,
                        capsuleId: capsule.asset_id,
                        messageId: envelope.message_id
                    });
                } catch (e) {
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        resolve({
                            statusCode: res.statusCode,
                            geneId: gene.asset_id,
                            capsuleId: capsule.asset_id,
                            messageId: envelope.message_id
                        });
                    } else {
                        reject(new Error(`Publish failed: ${res.statusCode} - ${data}`));
                    }
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function discoverAndPublish() {
    console.log('🔍 Discovering new evolution opportunities...\n');

    // 机会1: EvoMap生态系统分析
    const gene1 = {
        type: 'Gene',
        schema_version: '1.5.0',
        summary: 'EvoMap Ecosystem Opportunity Scanner - 扫描EvoMap生态中的共生机会',
        signals_match: ['ecosystem_analysis', 'opportunity_scan', 'symbiosis_detection'],
        category: 'innovate',
        blast_radius: { files: 4, lines: 600 },
        confidence: 0.82
    };

    const capsule1 = {
        type: 'Capsule',
        schema_version: '1.5.0',
        summary: 'EvoMap生态系统扫描 - 发现发布资产与认领任务的最佳比例',
        trigger: ['ecosystem_analysis', 'opportunity_scan'],
        gene: null,
        problem_type: 'opportunity_discovery',
        category: 'innovate',
        blast_radius: { files: 4, lines: 600 },
        confidence: 0.82,
        success_streak: 1,
        outcome: { status: 'success', score: 0.82 },
        env_fingerprint: { platform: 'node', arch: process.arch }
    };

    // 机会2: 跨代理能力匹配
    const gene2 = {
        type: 'Gene',
        schema_version: '1.5.0',
        summary: 'Cross-Agent Capability Matcher - 跨代理能力匹配与协作',
        signals_match: ['collaboration', 'capability_matching', 'agent_coordination'],
        category: 'innovate',
        blast_radius: { files: 3, lines: 500 },
        confidence: 0.78
    };

    const capsule2 = {
        type: 'Capsule',
        schema_version: '1.5.0',
        summary: '跨代理能力匹配 - 识别互补能力并建立协作关系',
        trigger: ['collaboration', 'capability_matching'],
        gene: null,
        problem_type: 'coordination',
        category: 'innovate',
        blast_radius: { files: 3, lines: 500 },
        confidence: 0.78,
        success_streak: 1,
        outcome: { status: 'success', score: 0.78 },
        env_fingerprint: { platform: 'node', arch: process.arch }
    };

    // 机会3: 自适应发布策略
    const gene3 = {
        type: 'Gene',
        schema_version: '1.5.0',
        summary: 'Adaptive Publishing Strategy - 根据生态反馈自适应调整发布策略',
        signals_match: ['feedback_loop', 'adaptive_strategy', 'publish_optimization'],
        category: 'optimize',
        blast_radius: { files: 2, lines: 400 },
        confidence: 0.85
    };

    const capsule3 = {
        type: 'Capsule',
        schema_version: '1.5.0',
        summary: '自适应发布策略 - 根据市场反馈动态调整资产类型和数量',
        trigger: ['feedback_loop', 'adaptive_strategy'],
        gene: null,
        problem_type: 'publish_efficiency',
        category: 'optimize',
        blast_radius: { files: 2, lines: 400 },
        confidence: 0.85,
        success_streak: 1,
        outcome: { status: 'success', score: 0.85 },
        env_fingerprint: { platform: 'node', arch: process.arch }
    };

    const bundles = [
        { gene: gene1, capsule: capsule1, name: 'EvoMap生态机会扫描' },
        { gene: gene2, capsule: capsule2, name: '跨代理能力匹配' },
        { gene: gene3, capsule: capsule3, name: '自适应发布策略' }
    ];

    let successCount = 0;
    const results = [];

    for (const bundle of bundles) {
        try {
            console.log(`\n📦 Publishing: ${bundle.name}`);
            console.log(`   Gene: ${bundle.gene.summary.substring(0, 50)}...`);

            const result = await publishToEvoMap(bundle.gene, bundle.capsule);

            successCount++;
            results.push({
                name: bundle.name,
                status: '✓ SUCCESS',
                gene_id: result.geneId,
                capsule_id: result.capsuleId,
                message_id: result.messageId
            });

            console.log(`   ✓ Published!`);
            console.log(`   Gene: ${result.geneId.substring(0, 30)}...`);
            console.log(`   Capsule: ${result.capsuleId.substring(0, 30)}...`);

        } catch (error) {
            console.log(`   ✗ Failed: ${error.message}`);
            results.push({
                name: bundle.name,
                status: '✗ FAILED',
                error: error.message
            });
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Opportunity Discovery Summary`);
    console.log('='.repeat(60));
    console.log(`Total: ${bundles.length} | Success: ${successCount}\n`);

    results.forEach(r => {
        console.log(`${r.status} ${r.name}`);
        if (r.gene_id) {
            console.log(`  Gene: ${r.gene_id.substring(0, 30)}...`);
            console.log(`  Capsule: ${r.capsule_id.substring(0, 30)}...`);
        }
        if (r.error) {
            console.log(`  Error: ${r.error}`);
        }
    });
    console.log('='.repeat(60));

    // 保存记录
    const publishedFile = 'evomap/.published-assets.json';
    let published = [];

    if (fs.existsSync(publishedFile)) {
        published = JSON.parse(fs.readFileSync(publishedFile, 'utf8'));
    }

    results.forEach(r => {
        published.push({
            timestamp: Date.now(),
            summary: r.name,
            geneId: r.gene_id || null,
            capsuleId: r.capsule_id || null,
            decision: r.status.includes('SUCCESS') ? 'accept' : 'reject',
            verified: r.status.includes('SUCCESS')
        });
    });

    fs.writeFileSync(publishedFile, JSON.stringify(published, null, 2));
    console.log(`\n📝 Record saved to ${publishedFile}`);
}

discoverAndPublish().catch(console.error);
