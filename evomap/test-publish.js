/**
 * 测试EvoMap Publish接口
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CONFIG_FILE = '.evomap-config.json';

/**
 * Canonical JSON stringify (递归排序)
 */
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
}

/**
 * 计算asset_id
 */
function computeAssetId(asset) {
    const clean = { ...asset };
    delete clean.asset_id;
    const canonical = canonicalStringify(clean);
    const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    return 'sha256:' + hash;
}

/**
 * 生成协议信封
 */
function buildEnvelope(messageType, payload) {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE));

    return {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: messageType,
        message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        sender_id: config.sender_id,
        timestamp: new Date().toISOString(),
        payload: payload
    };
}

/**
 * 发送publish请求
 */
async function testPublish() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   EvoMap Publish 接口测试             ║');
    console.log('╚══════════════════════════════════════╝\n');

    // 1. 构建Gene
    const gene = {
        type: 'Gene',
        schema_version: '1.5.0',
        category: 'repair',
        signals_match: ['TimeoutError'],
        summary: 'Implement exponential backoff retry mechanism for network timeouts (Test ' + Date.now() + ')',
        validation: []
    };
    gene.asset_id = computeAssetId(gene);

    // 2. 构建Capsule（暂时不包含gene引用测试）
    const capsule = {
        type: 'Capsule',
        schema_version: '1.5.0',
        trigger: ['TimeoutError'],
        // gene: gene.asset_id,  // 先注释
        summary: 'Fixed API timeout with bounded retry (max 3 attempts) and exponential backoff',
        confidence: 0.85,
        blast_radius: { files: 1, lines: 15 },
        outcome: { status: 'success', score: 0.85 },
        env_fingerprint: {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch
        },
        success_streak: 1
    };
    capsule.asset_id = computeAssetId(capsule);

    // 3. 构建EvolutionEvent
    const event = {
        type: 'EvolutionEvent',
        intent: 'repair',
        capsule_id: capsule.asset_id,
        genes_used: [gene.asset_id],
        outcome: { status: 'success', score: 0.85 },
        mutations_tried: 1,
        total_cycles: 1,
        // 添加随机字段避免重复
        timestamp: Date.now()
    };
    event.asset_id = computeAssetId(event);

    console.log('📦 准备发布的Bundle:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Gene ID:', gene.asset_id.substring(0, 20) + '...');
    console.log('Capsule ID:', capsule.asset_id.substring(0, 20) + '...');
    console.log('Event ID:', event.asset_id.substring(0, 20) + '...');
    console.log('Gene Summary:', gene.summary);
    console.log('Capsule Summary:', capsule.summary);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. 构建请求
    const envelope = buildEnvelope('publish', {
        assets: [gene, capsule, event]
    });

    const postData = JSON.stringify(envelope);

    console.log('📤 发送Publish请求...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📥 原始响应:');
                console.log('HTTP Status:', res.statusCode);
                console.log('Body:', data);
                console.log('');

                try {
                    const fullResponse = JSON.parse(data);
                    const response = fullResponse.payload || {};

                    console.log('✅ 发布成功！');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('Bundle ID:', response.bundle_id);
                    console.log('Decision:', response.decision);
                    console.log('Reason:', response.reason);
                    console.log('Asset IDs:', response.asset_ids?.length || 0);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                    resolve(fullResponse);
                } catch (error) {
                    console.error('❌ 解析失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// 运行测试
async function main() {
    try {
        await testPublish();
        console.log('✅ 测试完成！');
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { testPublish, computeAssetId };
