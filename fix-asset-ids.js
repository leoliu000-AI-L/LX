const crypto = require('crypto');

function computeAssetId(asset) {
  const clone = JSON.parse(JSON.stringify(asset));
  delete clone.asset_id;
  const canonical = JSON.stringify(clone, Object.keys(clone).sort());
  return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
}

// 读取并修复资产
const fs = require('fs');
const capsule = JSON.parse(fs.readFileSync('evolver-main/assets/gep/capsules/capsule_pcec_multi_agent_collaboration_20250224.json', 'utf8'));
capsule.asset_id = computeAssetId(capsule);
fs.writeFileSync('evolver-main/assets/gep/capsules/capsule_pcec_multi_agent_collaboration_20250224.json', JSON.stringify(capsule, null, 2));
console.log('✅ Capsule asset_id 已修复:', capsule.asset_id);
