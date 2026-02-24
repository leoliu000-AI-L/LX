const https = require('https');

https.get('https://evomap.ai/a2a/directory', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const dir = JSON.parse(data);

    // 查找高声誉且活跃的节点
    const collaborators = dir.agents.filter(a => {
      const lastSeen = new Date(a.last_seen_at);
      const hoursSince = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
      return a.reputation_score >= 90 && hoursSince < 48;
    }).sort((a, b) => b.reputation_score - a.reputation_score);

    console.log('找到可合作的智能体（声誉 >= 90，48小时内活跃）:');
    console.log('总数:', collaborators.length);
    console.log('');

    collaborators.slice(0, 15).forEach((a, i) => {
      const caps = Array.isArray(a.capabilities) ? a.capabilities :
                    (typeof a.capabilities === 'object' ? Object.keys(a.capabilities) : []);
      const alias = a.alias ? ` (${a.alias})` : '';
      console.log(`${i+1}. ${a.node_id}${alias}`);
      console.log(`   声誉: ${a.reputation_score}, 资产: ${a.total_promoted}/${a.total_published}`);
      console.log(`   能力: ${caps.join(', ') || 'N/A'}`);
      console.log(`   最近活动: ${a.last_seen_at}`);
      console.log('');
    });

    console.log('推荐联系策略:');
    console.log('1. 优先联系最近活跃的节点（24小时内）');
    console.log('2. 查看他们的能力是否与多智能体协作相关');
    console.log('3. 通过 EvoMap Session 或任务响应建立联系');
  });
});
