/**
 * 进化监控守护进程
 * 持续后台运行，认领EvoMap任务
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(__dirname, '.monitor-daemon.pid');
const LOG_FILE = path.join(__dirname, 'evolution-monitor.log');

/**
 * 启动守护进程
 */
function startDaemon() {
    // 检查是否已在运行
    if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
        try {
            process.kill(pid, 0); // 检查进程是否存在
            console.log('✅ 守护进程已在运行 (PID:', pid, ')');
            return;
        } catch (e) {
            fs.unlinkSync(PID_FILE); // 清理无效PID文件
        }
    }

    console.log('🚀 启动进化监控守护进程...');

    // 启动监控面板
    const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

    const monitor = spawn('node', ['evolution-dashboard.js'], {
        cwd: __dirname,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
    });

    // 保存PID
    fs.writeFileSync(PID_FILE, monitor.pid.toString());

    // 重定向日志
    monitor.stdout.pipe(logStream);
    monitor.stderr.pipe(logStream);

    console.log('✅ 守护进程已启动 (PID:', monitor.pid, ')');
    console.log('📝 日志文件:', LOG_FILE);
    console.log('\n使用命令管理:');
    console.log('  node evolution-monitor-daemon.js status  # 查看状态');
    console.log('  node evolution-monitor-daemon.js stop    # 停止守护进程');
    console.log('  tail -f evolution-monitor.log            # 查看实时日志\n');

    monitor.unref();
}

/**
 * 停止守护进程
 */
function stopDaemon() {
    if (!fs.existsSync(PID_FILE)) {
        console.log('ℹ️  守护进程未运行');
        return;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));

    try {
        process.kill(pid, 'SIGTERM');
        fs.unlinkSync(PID_FILE);
        console.log('✅ 守护进程已停止');
    } catch (e) {
        console.log('❌ 停止失败:', e.message);
    }
}

/**
 * 查看状态
 */
function showStatus() {
    if (!fs.existsSync(PID_FILE)) {
        console.log('ℹ️  守护进程未运行');
        return;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));

    try {
        process.kill(pid, 0);
        console.log('✅ 守护进程运行中');
        console.log('   PID:', pid);
        console.log('   日志:', LOG_FILE);

        // 显示最近日志
        if (fs.existsSync(LOG_FILE)) {
            const logs = fs.readFileSync(LOG_FILE, 'utf8');
            const lines = logs.split('\n').slice(-10);
            console.log('\n📝 最近日志:');
            lines.forEach(line => {
                if (line.trim()) console.log('  ', line);
            });
        }
    } catch (e) {
        console.log('❌ 守护进程已停止');
        fs.unlinkSync(PID_FILE);
    }
}

// 命令行接口
const command = process.argv[2] || 'start';

switch (command) {
    case 'start':
        startDaemon();
        break;
    case 'stop':
        stopDaemon();
        break;
    case 'restart':
        stopDaemon();
        setTimeout(() => startDaemon(), 1000);
        break;
    case 'status':
        showStatus();
        break;
    default:
        console.log('用法: node evolution-monitor-daemon.js [start|stop|restart|status]');
}
