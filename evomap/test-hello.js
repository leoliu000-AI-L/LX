/**
 * 测试EvoMap Hello接口
 */

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

// 配置
const CONFIG_FILE = '.evomap-config.json';

/**
 * 生成或加载sender_id
 */
function getSenderId() {
    if (fs.existsSync(CONFIG_FILE)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        console.log('✅ 使用已存在的sender_id:', config.sender_id);
        return config.sender_id;
    }

    // 生成新的sender_id
    const senderId = 'node_' + crypto.randomBytes(8).toString('hex');

    // 保存
    const config = { sender_id: senderId };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    console.log('✅ 生成新的sender_id:', senderId);
    return senderId;
}

/**
 * 生成message_id
 */
function generateMessageId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `msg_${timestamp}_${random}`;
}

/**
 * 发送hello请求
 */
function sendHello() {
    const sender_id = getSenderId();
    const messageId = generateMessageId();
    const timestamp = new Date().toISOString();

    const payload = {
        protocol: 'gep-a2a',
        protocol_version: '1.0.0',
        message_type: 'hello',
        message_id: messageId,
        sender_id: sender_id,
        timestamp: timestamp,
        payload: {
            capabilities: {
                problem_solving: true,
                code_generation: true,
                data_analysis: true
            },
            gene_count: 0,
            capsule_count: 0,
            env_fingerprint: {
                node_version: process.version,
                platform: process.platform,
                arch: process.arch,
                agent_name: 'TestAgent',
                agent_version: '1.0.0'
            }
        }
    };

    console.log('\n📤 发送Hello请求到EvoMap Hub...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Message ID:', messageId);
    console.log('Sender ID:', sender_id);
    console.log('Timestamp:', timestamp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const postData = JSON.stringify(payload);

    const options = {
        hostname: 'evomap.ai',
        port: 443,
        path: '/a2a/hello',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📥 原始响应:');
                console.log('HTTP Status:', res.statusCode);
                console.log('Headers:', JSON.stringify(res.headers, null, 2));
                console.log('Body:', data);
                console.log('');

                try {
                    const fullResponse = JSON.parse(data);

                    // 实际响应在payload字段里
                    const response = fullResponse.payload || {};

                    console.log('✅ 解析成功！');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('Status:', response.status);
                    console.log('Hub Node ID:', response.hub_node_id);
                    console.log('Claim Code:', response.claim_code);
                    console.log('Claim URL:', response.claim_url);
                    console.log('\n⚠️ 重要：访问Claim URL绑定节点到你的账户');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                    // 显示推荐的资产
                    if (response.recommended_assets && response.recommended_assets.length > 0) {
                        console.log('📚 推荐资产 (Top 5):');
                        response.recommended_assets.slice(0, 5).forEach((asset, i) => {
                            console.log(`\n${i + 1}. ${asset.summary.substring(0, 80)}...`);
                            console.log(`   GDI Score: ${asset.gdi_score}`);
                            console.log(`   Triggers: ${asset.triggers.join(', ')}`);
                        });
                        console.log('\n');
                    }

                    resolve(fullResponse);
                } catch (error) {
                    console.error('❌ 响应解析失败:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求失败:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// 运行测试
async function main() {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   EvoMap Hello 接口测试               ║');
    console.log('╚══════════════════════════════════════╝\n');

    try {
        await sendHello();
        console.log('✅ 测试完成！');
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { sendHello, getSenderId, generateMessageId };
