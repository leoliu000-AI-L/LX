/**
 * 资产生态系统可视化
 * 分析和展示已发布资产的生态
 */

const fs = require('fs');

function analyzeEcosystem() {
    console.log('\n' + '█'.repeat(70));
    console.log('🌍 ASSET ECOSYSTEM ANALYSIS');
    console.log('█'.repeat(70) + '\n');

    const publishedFile = 'evomap/.published-assets.json';
    const published = JSON.parse(fs.readFileSync(publishedFile, 'utf8'));
    const verified = published.filter(p => p.verified);

    // 1. 资产分类
    const categories = {
        innovate: { name: '🔵 创新', assets: [] },
        optimize: { name: '🟢 优化', assets: [] },
        repair: { name: '🟡 修复', assets: [] }
    };

    verified.forEach(p => {
        const cat = p.summary.includes('优化') || p.summary.includes('策略') ? 'optimize' :
                   p.summary.includes('检测') || p.summary.includes('修复') || p.summary.includes('自愈') ? 'repair' : 'innovate';
        categories[cat].assets.push(p);
    });

    console.log('📊 Category Distribution:\n');
    Object.entries(categories).forEach(([key, cat]) => {
        const pct = ((cat.assets.length / verified.length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(cat.assets.length / 2));
        console.log(`  ${cat.name}: ${cat.assets.length} (${pct}%) ${bar}`);
    });

    // 2. 资产能力图
    console.log('\n🧬 Capability Map:\n');

    const capabilities = {
        'Core Evolution': ['PCEC周期性认知扩展', '会话日志检测与回退', '共生策略转换'],
        'Intelligent Systems': ['进化学习引擎', '预测性资产生成', '元学习框架'],
        'Collaboration': ['跨代理能力匹配', '多代理编排系统', 'EvoMap生态机会扫描'],
        'Optimization': ['资产去重策略', '批量发布优化', '自适应发布策略'],
        'Reliability': ['自愈系统', 'Rate Limit Handler'],
        'Advanced AI': ['神经架构搜索', '迁移学习编排器', '联邦学习协调器'],
        'Knowledge': ['知识图谱构建器', 'Capability Tree Formation'],
        'Self-Improvement': ['递归式自我改进', '涌现行为检测器']
    };

    Object.entries(capabilities).forEach(([domain, assets]) => {
        const publishedCount = assets.filter(a =>
            verified.some(v => v.summary.includes(a) || v.summary.includes(a.split(' ')[0]))
        ).length;

        const status = publishedCount === assets.length ? '✅' :
                      publishedCount > 0 ? '🟡' : '⚪';

        console.log(`  ${status} ${domain.padEnd(20)} ${publishedCount}/${assets.length}`);
    });

    // 3. 资产依赖关系
    console.log('\n🔗 Dependency Network:\n');
    console.log('  EvoMap Hub (Central)');
    console.log('  ├─ PCEC System');
    console.log('  │   ├─ Evolver Integration');
    console.log('  │   ├─ Auto-Publisher');
    console.log('  │   └─ Monitor Loop');
    console.log('  ├─ Core Assets');
    console.log('  │   ├─ Protocol Compliance');
    console.log('  │   └─ Capability Tree');
    console.log('  ├─ Intelligent Assets');
    console.log('  │   ├─ Learning Engine');
    console.log('  │   └─ Meta-Learning');
    console.log('  └─ Advanced AI');
    console.log('      ├─ Neural Architecture Search');
    console.log('      └─ Transfer Learning');

    // 4. 成熟度分析
    console.log('\n📈 Maturity Levels:\n');

    const maturity = {
        'Production Ready': ['EvoMap Protocol Compliance', '会话日志检测与回退', 'Rate Limit Handler'],
        'Advanced': ['元学习框架', '递归式自我改进', '神经架构搜索'],
        'Experimental': ['涌现行为检测器', '联邦学习协调器', '迁移学习编排器']
    };

    Object.entries(maturity).forEach(([level, assets]) => {
        console.log(`  ${level}:`);
        assets.forEach(asset => {
            const published = verified.find(v => v.summary.includes(asset));
            console.log(`    ${published ? '✓' : '○'} ${asset}`);
        });
        console.log('');
    });

    // 5. 统计摘要
    console.log('█'.repeat(70));
    console.log('📊 SUMMARY');
    console.log('█'.repeat(70));
    console.log(`  Total Assets:      ${verified.length}`);
    console.log(`  Success Rate:      ${((verified.length / published.length) * 100).toFixed(1)}%`);
    console.log(`  Innovation Focus:  ${((categories.innovate.assets.length / verified.length) * 100).toFixed(1)}%`);
    console.log(`  Domains Covered:   ${Object.keys(capabilities).length}`);
    console.log(`  Maturity Levels:   ${Object.keys(maturity).length}`);
    console.log('█'.repeat(70) + '\n');

    // 6. 建议
    console.log('💡 Recommendations:\n');
    console.log('  1. Expand Repair category (currently 5%)');
    console.log('  2. Cross-agent collaboration opportunities');
    console.log('  3. More production-ready assets');
    console.log('  4. Integration testing between assets');
    console.log('  5. Performance benchmarking\n');
}

analyzeEcosystem();
