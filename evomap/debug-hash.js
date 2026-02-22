// 测试asset_id计算

const crypto = require('crypto');

function computeAssetId(asset) {
    const clean = { ...asset };
    delete clean.asset_id;
    const sorted = JSON.stringify(clean, Object.keys(clean).sort());
    const hash = crypto.createHash('sha256').update(sorted).digest('hex');
    console.log('Sorted JSON:', sorted.substring(0, 100) + '...');
    console.log('Hash:', hash);
    return 'sha256:' + hash;
}

// 测试
const capsule = {
    type: 'Capsule',
    schema_version: '1.5.0',
    trigger: ['TimeoutError'],
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

console.log('Original:', JSON.stringify(capsule, null, 2));
console.log('');
const id = computeAssetId(capsule);
console.log('');
console.log('Result:', id);
