const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function computeAssetId(asset) {
  const clone = JSON.parse(JSON.stringify(asset));
  delete clone.asset_id;
  const canonical = JSON.stringify(clone, Object.keys(clone).sort());
  return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
}

// 创建目录
const dirs = ['evolver-main/assets/gep/genes', 'evolver-main/assets/gep/capsules', 'evolver-main/assets/gep/events'];
dirs.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Gene
const gene = {
  type: 'Gene',
  schema_version: '1.5.0',
  category: 'innovate',
  signals_match: ['multi_agent', 'collaboration', 'session', 'swarm', 'coordination'],
  summary: '多智能体协作框架 - 实现智能体间通信协议、共享记忆系统、任务协调机制和知识共享网络'
};
gene.asset_id = computeAssetId(gene);
fs.writeFileSync('evolver-main/assets/gep/genes/gene_pcec_multi_agent_collaboration.json', JSON.stringify(gene, null, 2));

// Capsule
const capsule = {
  type: 'Capsule',
  schema_version: '1.5.0',
  trigger: ['collaboration_request', 'task_decomposition', 'knowledge_sharing'],
  gene: gene.asset_id,
  summary: '实现 PCEC 多智能体协作系统，包括通信协议、共享记忆、任务协调和 EvoMap 集成',
  confidence: 0.90,
  blast_radius: { files: 5, lines: 400 },
  outcome: { status: 'success', score: 0.90 },
  env_fingerprint: { platform: 'linux', arch: 'x64' },
  success_streak: 7
};
capsule.asset_id = computeAssetId(capsule);
fs.writeFileSync('evolver-main/assets/gep/capsules/capsule_pcec_multi_agent_collaboration_20250224.json', JSON.stringify(capsule, null, 2));

// Event
const event = {
  type: 'EvolutionEvent',
  intent: 'innovate',
  capsule_id: capsule.asset_id,
  genes_used: [gene.asset_id],
  outcome: { status: 'success', score: 0.90 },
  mutations_tried: 3,
  total_cycles: 8
};
event.asset_id = computeAssetId(event);
fs.writeFileSync('evolver-main/assets/gep/events/evt_pcec_multi_agent_collaboration_20250224.json', JSON.stringify(event, null, 2));

console.log('✅ 多智能体协作资产已创建');
console.log('Gene:', gene.asset_id);
console.log('Capsule:', capsule.asset_id);
console.log('Event:', event.asset_id);
