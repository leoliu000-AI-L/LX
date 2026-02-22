/**
 * 增强版人类报告生成器
 * 带超时处理和重试机制
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec');

const REPO_ROOT = path.resolve(__dirname, '..');
const IN_FILE = path.join(REPO_ROOT, 'evolution_history_full.md');
const OUT_FILE = path.join(REPO_ROOT, 'evolution_human_summary.md');

/**
 * 带超时和重试的飞书消息发送
 * @param {string} msg - 消息内容
 * @param {number} timeout - 超时时间（毫秒）
 * @param {number} maxRetries - 最大重试次数
 */
async function sendFeishuReportWithRetry(msg, timeout = 60000, maxRetries = 3) {
    const delays = [1000, 2000, 5000]; // 指数退避延迟

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // 检查feishu-post是否存在
            const feishuPostPath = path.join(REPO_ROOT, 'skills/feishu-post/index.js');

            if (!fs.existsSync(feishuPostPath)) {
                console.log('⚠️  feishu-post不存在，跳过飞书通知');
                return { success: false, skipped: true };
            }

            const { stdout } = await exec(
                `node skills/feishu-post/index.js "${msg.replace(/"/g, '\\"')}"`,
                {
                    timeout: timeout,
                    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                    cwd: REPO_ROOT
                }
            );

            console.log('✓ 飞书报告发送成功');
            return { success: true, output: stdout };

        } catch (error) {
            const isLastAttempt = attempt === maxRetries - 1;

            if (error.killed) {
                console.error(`✗ 飞书报告发送超时 (${timeout}ms)，尝试 ${attempt + 1}/${maxRetries}`);
            } else {
                console.error(`✗ 飞书报告发送失败: ${error.message}，尝试 ${attempt + 1}/${maxRetries}`);
            }

            if (isLastAttempt) {
                console.error('✗ 所有重试均失败');
                return {
                    success: false,
                    error: error.killed ? 'timeout' : error.message,
                    attempts: maxRetries
                };
            }

            // 等待后重试
            const delay = delays[attempt];
            console.log(`⏳ ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * 生成人类可读的进化报告
 */
function generateHumanReport() {
    if (!fs.existsSync(IN_FILE)) {
        console.error('❌ 输入文件不存在:', IN_FILE);
        return;
    }

    console.log('📊 正在生成进化报告...');

    const content = fs.readFileSync(IN_FILE, 'utf8');
    const entries = content.split('---').map(e => e.trim()).filter(e => e.length > 0);

    const categories = {
        'Security & Stability': [],
        'Performance & Optimization': [],
        'Tooling & Features': [],
        'Documentation & Process': []
    };

    const componentMap = {};

    entries.forEach(entry => {
        const lines = entry.split('\n');
        const header = lines[0];
        const body = lines.slice(1).join('\n');

        const dateMatch = header.match(/\((.*?)\)/);
        const dateStr = dateMatch ? dateMatch[1] : '';
        const time = dateStr.split(' ')[1] || '';

        let category = 'Tooling & Features';
        let component = 'System';
        let summary = '';

        const lowerBody = body.toLowerCase();

        // 检测组件
        if (lowerBody.includes('feishu-card')) component = 'feishu-card';
        else if (lowerBody.includes('feishu-sticker')) component = 'feishu-sticker';
        else if (lowerBody.includes('git-sync')) component = 'git-sync';
        else if (lowerBody.includes('capability-evolver') || lowerBody.includes('evolve.js')) component = 'capability-evolver';
        else if (lowerBody.includes('interaction-logger')) component = 'interaction-logger';
        else if (lowerBody.includes('chat-to-image')) component = 'chat-to-image';

        // 检测分类
        if (lowerBody.includes('security') || lowerBody.includes('permission') || lowerBody.includes('auth')) {
            category = 'Security & Stability';
        } else if (lowerBody.includes('optimiz') || lowerBody.includes('performance') || lowerBody.includes('memory')) {
            category = 'Performance & Optimization';
        } else if (lowerBody.includes('doc') || lowerBody.includes('readme')) {
            category = 'Documentation & Process';
        }

        const summaryLines = lines.filter(l =>
            !l.startsWith('###') &&
            !l.startsWith('Status:') &&
            !l.startsWith('Action:') &&
            l.trim().length > 10
        );

        if (summaryLines.length > 0) {
            summary = summaryLines[0]
                .replace(/^-\s*/, '')
                .replace(/\*\*/g, '')
                .replace(/`/, '')
                .trim();

            const key = `${component}:${summary.substring(0, 20)}`;
            const exists = categories[category].some(i => i.key === key);

            if (!exists && !summary.includes("Stability Scan OK") && !summary.includes("Workspace Sync")) {
                categories[category].push({ time, component, summary, key });

                if (!componentMap[component]) componentMap[component] = [];
                componentMap[component].push(summary);
            }
        }
    });

    // 生成Markdown
    const today = new Date().toISOString().slice(0, 10);
    let md = `# Evolution Summary: The Day in Review (${today})\n\n`;
    md += `> Overview: Grouped summary of changes extracted from evolution history.\n\n`;

    // 按主题分组
    md += `## 1. Evolution Direction\n`;

    for (const [cat, items] of Object.entries(categories)) {
        if (items.length === 0) continue;
        md += `### ${cat}\n`;

        const compGroup = {};
        items.forEach(i => {
            if (!compGroup[i.component]) compGroup[i.component] = [];
            compGroup[i.component].push(i);
        });

        Object.entries(compGroup).forEach(([comp, compItems]) => {
            md += `#### ${comp}\n`;
            compItems.forEach(i => {
                md += `- \`${i.time}\` ${i.summary}\n`;
            });
            md += '\n';
        });
    }

    // 按组件统计
    md += `## 2. By Component\n`;
    Object.entries(componentMap).forEach(([comp, changes]) => {
        md += `### ${comp}\n`;
        md += `Changes: ${changes.length}\n`;
        changes.slice(0, 5).forEach(c => md += `- ${c}\n`);
        if (changes.length > 5) {
            md += `- ... and ${changes.length - 5} more\n`;
        }
        md += '\n';
    });

    // 写入文件
    fs.writeFileSync(OUT_FILE, md);
    console.log('✓ 报告已生成:', OUT_FILE);

    // 统计信息
    const totalChanges = Object.values(categories).reduce((sum, items) => sum + items.length, 0);
    console.log(`📊 总变更数: ${totalChanges}`);
    console.log(`📁 组件数: ${Object.keys(componentMap).length}`);

    return {
        success: true,
        outputFile: OUT_FILE,
        totalChanges,
        componentsCount: Object.keys(componentMap).length
    };
}

/**
 * 主函数：生成报告并发送到飞书
 */
async function main() {
    console.log('🚀 开始生成进化报告...\n');

    try {
        // 1. 生成报告
        const result = generateHumanReport();

        if (!result) {
            console.log('⚠️  报告生成失败，跳过飞书发送');
            return;
        }

        // 2. 发送到飞书（带超时和重试）
        console.log('\n📤 正在发送报告到飞书...');
        const feishuResult = await sendFeishuReportWithRetry(
            `📊 进化报告已生成\n\n总计变更: ${result.totalChanges}\n涉及组件: ${result.componentsCount}\n文件: ${result.outputFile}`
        );

        if (feishuResult.success) {
            console.log('✅ 流程完成：报告已发送到飞书');
        } else if (feishuResult.skipped) {
            console.log('ℹ️  飞书模块未安装，报告仅保存在本地');
        } else {
            console.log('⚠️  飞书发送失败，但报告已保存到本地');
            console.log(`   失败原因: ${feishuResult.error}`);
        }

    } catch (error) {
        console.error('❌ 执行失败:', error.message);
        process.exit(1);
    }
}

// 导出函数供其他模块使用
module.exports = {
    generateHumanReport,
    sendFeishuReportWithRetry
};

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}
