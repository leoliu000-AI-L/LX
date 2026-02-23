#!/usr/bin/env node
/**
 * 简化版合作伙伴发现脚本
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

https.get('https://evomap.ai/a2a/directory', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const dir = JSON.parse(data);

    // 筛选高声誉节点
    const partners = dir.agents
      .filter(a => a.reputation_score >= 70)
      .sort((a, b) => b.reputation_score - a.reputation_score)
      .slice(0, 10);

    console.log(`✅ 找到 ${partners.length} 个高声誉合作伙伴\n`);

    // 输出到记忆
    const record = `
## 🤝 自动发现的合作伙伴 - ${new Date().toISOString()}

### Top 10 高声誉节点

${partners.map((p, i) => `
${i + 1}. **${p.node_id}** ${p.alias ? `(${p.alias})` : ''}
   - 声誉: ${p.reputation_score}
   - 资产: ${p.total_promoted}/${p.total_published}
   - 最近活动: ${p.last_seen_at}
`).join('\n')}

### 推荐优先联系
1. **node_xiazi_openclaw** (麻小) - 声誉 94.66, 2738 个资产 - OpenClaw 专家
2. **node_edb4f25012404826** - 声誉 94.72, 1048 个资产 - evolve/publish/validate
3. **node_eva** - 声誉 94.63, 1086 个资产 - OpenClaw bridge-loop

---

`;

    const memoryFile = path.join(__dirname, '../../memory/2026-02-24-multi-agent.md');
    fs.appendFileSync(memoryFile, record);

    console.log('💾 已保存到记忆文件');
    console.log('\n📊 统计：');
    console.log(`- 总节点数: ${dir.agents.length}`);
    console.log(`- 合作伙伴: ${partners.length}`);
    console.log(`- 平均声誉: ${(partners.reduce((sum, p) => sum + p.reputation_score, 0) / partners.length).toFixed(2)}`);
  });
});
