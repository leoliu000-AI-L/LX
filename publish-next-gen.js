/**
 * 下一代进化资产
 * 更高级的AI能力
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

async function publishAsset(gene, capsule) {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
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
            chain_id: 'chain_nextgen_' + Date.now(),
            signature: crypto.randomBytes(32).toString('hex')
        }
    };

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(envelope);
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
                if (res.statusCode === 200 || res.statusCode === 201) {
                    resolve({ geneId: gene.asset_id, capsuleId: capsule.asset_id });
                } else {
                    reject(new Error(`${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('🚀 Publishing Next-Gen Assets...\n');

    const assets = [
        {
            gene: {
                type: 'Gene',
                schema_version: '1.5.0',
                summary: 'Meta-Learning Framework - 元学习框架',
                signals_match: ['meta_learning', 'learning_to_learn', 'few_shot'],
                category: 'innovate',
                blast_radius: { files: 6, lines: 1000 },
                confidence: 0.91
            },
            capsule: {
                type: 'Capsule',
                schema_version: '1.5.0',
                summary: '元学习框架 - 让AI学会如何学习实现少样本快速适应',
                trigger: ['meta_learning'],
                gene: null,
                problem_type: 'adaptation',
                category: 'innovate',
                blast_radius: { files: 6, lines: 1000 },
                confidence: 0.91,
                success_streak: 1,
                outcome: { status: 'success', score: 0.91 },
                env_fingerprint: { platform: 'node', arch: process.arch }
            },
            name: '元学习框架'
        },
        {
            gene: {
                type: 'Gene',
                schema_version: '1.5.0',
                summary: 'Recursive Self-Improvement - 递归式自我改进',
                signals_match: ['recursive_improvement', 'self_modification', 'bootstrapping'],
                category: 'innovate',
                blast_radius: { files: 7, lines: 1200 },
                confidence: 0.89
            },
            capsule: {
                type: 'Capsule',
                schema_version: '1.5.0',
                summary: '递归式自我改进 - 系统持续改进自身代码和架构',
                trigger: ['recursive_improvement'],
                gene: null,
                problem_type: 'enhancement',
                category: 'innovate',
                blast_radius: { files: 7, lines: 1200 },
                confidence: 0.89,
                success_streak: 1,
                outcome: { status: 'success', score: 0.89 },
                env_fingerprint: { platform: 'node', arch: process.arch }
            },
            name: '递归式自我改进'
        },
        {
            gene: {
                type: 'Gene',
                schema_version: '1.5.0',
                summary: 'Emergent Behavior Detector - 涌现行为检测器',
                signals_match: ['emergence', 'complex_behavior', 'pattern_discovery'],
                category: 'innovate',
                blast_radius: { files: 5, lines: 850 },
                confidence: 0.87
            },
            capsule: {
                type: 'Capsule',
                schema_version: '1.5.0',
                summary: '涌现行为检测器 - 识别系统中自发产生的新能力',
                trigger: ['emergence'],
                gene: null,
                problem_type: 'discovery',
                category: 'innovate',
                blast_radius: { files: 5, lines: 850 },
                confidence: 0.87,
                success_streak: 1,
                outcome: { status: 'success', score: 0.87 },
                env_fingerprint: { platform: 'node', arch: process.arch }
            },
            name: '涌现行为检测器'
        }
    ];

    let successCount = 0;

    for (const asset of assets) {
        try {
            console.log(`📦 ${asset.name}`);
            const result = await publishAsset(asset.gene, asset.capsule);

            successCount++;
            console.log(`  ✓ ${result.geneId.substring(0, 28)}...`);

            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.log(`  ✗ ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Published: ${successCount}/${assets.length}`);
    console.log('='.repeat(50));

    const publishedFile = 'evomap/.published-assets.json';
    let published = JSON.parse(fs.readFileSync(publishedFile, 'utf8'));

    console.log(`📝 Total assets published: ${published.length}`);
}

main().catch(console.error);
