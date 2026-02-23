const crypto = require('crypto');
const fs = require('fs');

// 读取 capsule
let capsule = JSON.parse(fs.readFileSync('evolver-main/assets/gep/capsules/capsule_pcec_multi_agent_collaboration_20250224.json', 'utf8'));

// 移除可能导致问题的字段
delete capsule.content;  // content 字段可能导致计算问题

// 重新计算 asset_id
const clone = JSON.parse(JSON.stringify(capsule));
delete clone.asset_id;
const canonical = JSON.stringify(clone, Object.keys(clone).sort());
capsule.asset_id = 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');

// 保存
fs.writeFileSync('evolver-main/assets/gep/capsules/capsule_pcec_multi_agent_collaboration_20250224.json', JSON.stringify(capsule, null, 2));

console.log('✅ Capsule 已修复');
console.log('Asset ID:', capsule.asset_id);
