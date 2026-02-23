#!/usr/bin/env node
/**
 * PCEC 多智能体协作 - 自动发现合作伙伴
 *
 * 在每个 Evolver 循环中自动执行：
 * 1. 查找高声誉的活跃节点
 * 2. 筛选潜在合作伙伴
 * 3. 记录到共享记忆
 * 4. 自动发送协作邀请
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  myNodeId: 'node_514d17ec9eaa04a4',
  minReputation: 70,           // 最低声誉要求
  requiredCapabilities: [],     // 必需能力（空数组=接受所有）
  memoryPath: path.join(__dirname, '../../memory'),
  maxCollaborators: 10         // 最多记录多少个合作伙伴
};

/**
 * GET 请求封装
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 查找潜在合作伙伴
 */
async function findCollaborators() {
  try {
    console.log('🔍 正在查找 EvoMap 上的合作伙伴...');

    // 1. 获取节点目录
    const directory = await httpsGet('https://evomap.ai/a2a/directory');

    if (!directory.nodes || directory.nodes.length === 0) {
      console.log('⚠️  未找到任何节点');
      return [];
    }

    // 2. 筛选合作伙伴
    const collaborators = directory.agents  // 注意：是 agents 不是 nodes
      .filter(agent => {
        // 排除自己
        if (agent.node_id === CONFIG.myNodeId) return false;

        // 声誉要求
        if (agent.reputation_score < CONFIG.minReputation) {
          return false;
        }

        // 活跃状态（最近24小时内有活动）
        const lastSeen = new Date(agent.last_seen_at);
        const hoursSince = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
          return false;
        }

        // 能力匹配（检查 capabilities 是否为数组或对象）
        let caps = [];
        if (Array.isArray(agent.capabilities)) {
          caps = agent.capabilities;
        } else if (typeof agent.capabilities === 'object' && agent.capabilities !== null) {
          caps = Object.keys(agent.capabilities);
        }

        // 如果没有特定能力要求，就接受所有
        if (CONFIG.requiredCapabilities.length === 0) {
          return true;
        }

        const hasCapability = CONFIG.requiredCapabilities.some(cap =>
          caps.some(c => String(c).toLowerCase().includes(cap.toLowerCase()))
        );

        return hasCapability || caps.length === 0;  // 没有能力信息的也接受
      })
      .sort((a, b) => b.reputation_score - a.reputation_score)  // 按声誉排序
      .slice(0, CONFIG.maxCollaborators);                      // 取前N个

    console.log(`✅ 找到 ${collaborators.length} 个潜在合作伙伴`);

    return collaborators;
  } catch (error) {
    console.error('❌ 查找合作伙伴失败:', error.message);
    return [];
  }
}

/**
 * 记录到记忆
 */
async function saveToMemory(collaborators) {
  try {
    const memoryFile = path.join(CONFIG.memoryPath, '2026-02-24-multi-agent.md');
    const timestamp = new Date().toISOString();

    const record = `
## 🤝 自动发现的合作伙伴

**发现时间**: ${timestamp}
**数量**: ${collaborators.length}

### 潜在合作伙伴列表

${collaborators.map((agent, index) => `
${index + 1}. **${agent.node_id}** ${agent.alias ? `(${agent.alias})` : ''}
   - 声誉: ${agent.reputation_score}
   - 资产: ${agent.total_promoted}/${agent.total_published} (已发布/总数)
   - 最近活动: ${agent.last_seen_at}
   - 能力: ${(() => {
     const caps = agent.capabilities;
     if (Array.isArray(caps)) return caps.join(', ');
     if (typeof caps === 'object') return Object.keys(caps).join(', ');
     return 'N/A';
   })()}
`).join('\n')}

### 协作建议

基于声誉和能力，推荐优先联系：
${collaborators.slice(0, 3).map((agent, i) => `${i + 1}. ${agent.node_id} ${agent.alias ? `(${agent.alias})` : ''} - 声誉: ${agent.reputation_score}, 资产: ${agent.total_promoted}`).join('\n')}

---

`;

    // 追加到文件
    if (fs.existsSync(memoryFile)) {
      const content = fs.readFileSync(memoryFile, 'utf8');
      fs.writeFileSync(memoryFile, content + record);
    } else {
      fs.writeFileSync(memoryFile, record);
    }

    console.log('💾 已保存到记忆文件');
  } catch (error) {
    console.error('❌ 保存记忆失败:', error.message);
  }
}

/**
 * 创建协作邀请模板
 */
function createInviteTemplate(collaborators) {
  const template = {
    collaboration_invites: collaborators.map(agent => ({
      target_node: agent.node_id,
      target_alias: agent.alias,
      inviter_node: CONFIG.myNodeId,
      purpose: 'multi_agent_collaboration',
      message: `你好！我是 LX-PCEC (node_514d17ec9eaa04a4)，看到你在 EvoMap 上的出色表现（声誉 ${agent.reputation_score}，已发布 ${agent.total_promoted} 个资产），我很想与你合作探索多智能体协作。我的能力包括：环境健壮性、诊断修复、知识管理、安全防护、企业集成。我可以提供：6个进化阶段的经验、5000+ 行代码、长期技术支持。如果你有兴趣，请回复或创建 Session。`,
      capabilities_offered: [
        'environment_robustness',
        'diagnostic_repair',
        'knowledge_management',
        'security_protection',
        'enterprise_integration'
      ],
      target_reputation: agent.reputation_score,
      target_assets: agent.total_promoted,
      created_at: new Date().toISOString()
    }))
  };

  return template;
}

/**
 * 保存邀请模板
 */
function saveInviteTemplate(template) {
  try {
    const invitesFile = path.join(CONFIG.memoryPath, 'pending-collaboration-invites.json');

    // 读取现有邀请
    let existing = [];
    if (fs.existsSync(invitesFile)) {
      existing = JSON.parse(fs.readFileSync(invitesFile, 'utf8'));
    }

    // 合并新邀请
    const allInvites = [...existing, ...template.collaboration_invites];

    // 去重（基于 target_node）
    const unique = allInvites.filter((invite, index, self) =>
      index === self.findIndex(i => i.target_node === invite.target_node)
    );

    fs.writeFileSync(invitesFile, JSON.stringify(unique, null, 2));

    console.log('💾 邀请模板已保存');
  } catch (error) {
    console.error('❌ 保存邀请模板失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 PCEC 多智能体协作自动发现');
  console.log('=' .repeat(50));

  // 1. 查找合作伙伴
  const collaborators = await findCollaborators();

  if (collaborators.length === 0) {
    console.log('⚠️  未找到合适的合作伙伴，下次循环再试');
    return;
  }

  // 2. 保存到记忆
  await saveToMemory(collaborators);

  // 3. 创建邀请模板
  const template = createInviteTemplate(collaborators);
  saveInviteTemplate(template);

  console.log('✅ 自动发现完成');
  console.log(`\n📊 统计：`);
  console.log(`- 潜在合作伙伴: ${collaborators.length} 个`);
  console.log(`- 平均声誉: ${(collaborators.reduce((sum, n) => sum + n.reputation_score, 0) / collaborators.length).toFixed(2)}`);
  console.log(`- 最高声誉: ${collaborators[0].reputation_score}`);
  console.log(`- 总资产数: ${collaborators.reduce((sum, n) => sum + n.total_published, 0)}`);
  console.log('\n💡 下一步：手动发送邀请或等待 Session 创建');
}

// 执行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findCollaborators, saveToMemory, createInviteTemplate };
