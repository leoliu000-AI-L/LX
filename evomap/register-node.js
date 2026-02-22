/**
 * EvoMap节点注册
 * 首次使用时运行此脚本注册你的Agent节点
 */

const evomap = require('./evomap-client');
const fs = require('fs');
const path = require('path');

/**
 * 生成新的sender_id
 * @returns {string} 新的sender_id
 */
function generateSenderId() {
    const crypto = require('crypto');
    return 'node_' + crypto.randomBytes(8).toString('hex');
}

/**
 * 保存配置到文件
 * @param {Object} config - 配置对象
 */
function saveConfig(config) {
    const configPath = path.join(__dirname, '.evomap-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ 配置已保存到:', configPath);
}

/**
 * 读取配置文件
 * @returns {Object|null} 配置对象
 */
function loadConfig() {
    const configPath = path.join(__dirname, '.evomap-config.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config;
    }
    return null;
}

/**
 * 注册节点到EvoMap
 * @param {Object} config - 配置对象
 */
async function registerNode(config) {
    console.log('🚀 正在注册节点到EvoMap...\n');

    // 初始化客户端
    evomap.initSenderId(config);

    // 构建hello消息
    const payload = {
        capabilities: {
            problem_solving: true,
            code_generation: true,
            data_analysis: true,
            web_automation: true
        },
        gene_count: config.gene_count || 0,
        capsule_count: config.capsule_count || 0,
        env_fingerprint: {
            platform: process.platform,
            arch: process.arch,
            node_version: process.version,
            agent_name: config.agent_name || 'Custom Agent',
            agent_version: config.agent_version || '1.0.0'
        }
    };

    // 可选：添加webhook URL
    if (config.webhook_url) {
        payload.webhook_url = config.webhook_url;
        console.log('📡 Webhook URL:', config.webhook_url);
    }

    const envelope = evomap.buildEnvelope('hello', payload);

    try {
        const response = await evomap.postToHub('/a2a/hello', envelope);

        console.log('\n✅ 节点注册成功！\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 节点信息:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Sender ID:', evomap.SENDER_ID);
        console.log('Hub Node ID:', response.hub_node_id);
        console.log('');
        console.log('🔑 Claim Code:', response.claim_code);
        console.log('🔗 Claim URL:', response.claim_url);
        console.log('');
        console.log('⏰ Claim Code有效期: 24小时');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('⚠️  重要提示:');
        console.log('1. 请访问上面的Claim URL将此节点绑定到你的EvoMap账户');
        console.log('2. Claim Code过期后可以重新运行此脚本获取新的');
        console.log('3. 你的sender_id是永久身份标识，请妥善保管\n');

        return response;
    } catch (error) {
        console.error('\n❌ 注册失败:', error.message);
        console.error('\n可能的原因:');
        console.error('1. 网络连接问题');
        console.error('2. sender_id格式不正确（必须以node_开头）');
        console.error('3. Hub服务器暂时不可用\n');
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   EvoMap Agent 节点注册工具          ║');
    console.log('╚══════════════════════════════════════╝\n');

    // 检查是否已有配置
    const existingConfig = loadConfig();

    if (existingConfig) {
        console.log('📁 发现已存在的配置文件');
        console.log('Sender ID:', existingConfig.sender_id);
        console.log('');

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            rl.question('是否使用现有配置重新注册？(y/n): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y') {
            console.log('❌ 取消注册');
            process.exit(0);
        }

        await registerNode(existingConfig);
    } else {
        // 生成新的sender_id
        const senderId = generateSenderId();
        console.log('✅ 生成新的Sender ID:', senderId);

        const config = {
            sender_id: senderId,
            agent_name: 'MyAgent',
            agent_version: '1.0.0',
            gene_count: 0,
            capsule_count: 0
        };

        // 询问是否添加webhook
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const webhookAnswer = await new Promise(resolve => {
            rl.question('是否配置Webhook URL？(可选，留空跳过): ', resolve);
        });
        rl.close();

        if (webhookAnswer.trim()) {
            config.webhook_url = webhookAnswer.trim();
        }

        // 保存配置
        saveConfig(config);

        // 注册节点
        await registerNode(config);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程序异常退出:', error.message);
        process.exit(1);
    });
}

module.exports = { registerNode, generateSenderId, saveConfig, loadConfig };
