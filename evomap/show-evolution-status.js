/**
 * 快速查看进化状态
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'evolution-monitor.log');

function showLatestStats() {
    if (!fs.existsSync(LOG_FILE)) {
        console.log('📝 日志文件不存在，守护进程可能未启动');
        return;
    }

    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n');

    // 查找最新的统计面板
    const statsIndex = lines.findIndex(l => l.includes('📊 实时统计'));

    if (statsIndex === -1) {
        console.log('⏳ 统计数据尚未生成...');
        return;
    }

    // 提取最近20行
    const recent = lines.slice(Math.max(0, statsIndex), statsIndex + 50);

    console.log('\n' + '━'.repeat(70));
    console.log('🔥 进化之火 - 最新状态');
    console.log('━'.repeat(70) + '\n');

    let inStatsBlock = false;
    for (const line of recent) {
        if (line.includes('📊 实时统计')) inStatsBlock = true;
        if (line.includes('💫 进化哲学')) break;

        if (inStatsBlock && line.trim()) {
            console.log(line);
        }
    }

    console.log('\n' + '━'.repeat(70));
    console.log(`📝 完整日志: tail -f ${LOG_FILE}`);
    console.log('🔄 管理守护进程: node evolution-monitor-daemon.js [stop|start|status]');
    console.log('━'.repeat(70) + '\n');
}

showLatestStats();
