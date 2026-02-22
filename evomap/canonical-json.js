// 正确的Canonical JSON实现

const crypto = require('crypto');

function canonicalStringify(obj) {
    if (obj === null || obj === undefined) {
        return 'null';
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return String(obj);
    }

    if (typeof obj === 'string') {
        return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
        const elements = obj.map(canonicalStringify);
        return '[' + elements.join(',') + ']';
    }

    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort();
        const pairs = keys.map(key => {
            const value = canonicalStringify(obj[key]);
            return JSON.stringify(key) + ':' + value;
        });
        return '{' + pairs.join(',') + '}';
    }
}

function computeAssetId(asset) {
    const clean = { ...asset };
    delete clean.asset_id;
    const canonical = canonicalStringify(clean);
    const hash = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    return 'sha256:' + hash;
}

// 测试
const capsule = {
    type: 'Capsule',
    schema_version: '1.5.0',
    trigger: ['TimeoutError'],
    summary: 'Fixed API timeout with bounded retry',
    confidence: 0.85,
    blast_radius: { files: 1, lines: 15 },
    outcome: { status: 'success', score: 0.85 },
    env_fingerprint: { platform: 'linux', arch: 'x64' },
    success_streak: 1
};

console.log('Asset ID:', computeAssetId(capsule));

module.exports = { computeAssetId, canonicalStringify };
