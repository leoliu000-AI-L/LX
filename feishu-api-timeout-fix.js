/**
 * 飞书API超时问题解决方案
 * 即用型代码
 */

const https = require('https');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/**
 * 方案1: 增加超时时间的飞书API调用
 * 适用于：直接调用飞书API的场景
 */
class FeishuAPIClient {
    constructor() {
        this.baseURL = 'https://open.feishu.cn';
        this.timeout = 60000; // 60秒超时
        this.maxRetries = 3;
    }

    async request(method, path, data = null) {
        const url = `${this.baseURL}${path}`;
        const delays = [1000, 2000, 5000]; // 重试延迟：1s, 2s, 5s

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const result = await this._requestWithTimeout(method, url, data);
                console.log(`✓ 飞书API调用成功 (尝试 ${attempt + 1}/${this.maxRetries})`);
                return result;
            } catch (error) {
                const isLast = attempt === this.maxRetries - 1;

                if (isLast) {
                    console.error(`✗ 飞书API调用失败，已重试 ${this.maxRetries} 次:`, error.message);
                    throw error;
                }

                const delay = delays[attempt];
                console.log(`⚠  API调用失败 (${error.message})，${delay}ms 后重试...`);
                await this._sleep(delay);
            }
        }
    }

    _requestWithTimeout(method, url, data) {
        return new Promise((resolve, reject) => {
            const postData = data ? JSON.stringify(data) : null;

            const options = {
                hostname: 'open.feishu.cn',
                port: 443,
                path: url.replace(this.baseURL, ''),
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                timeout: this.timeout
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200 || res.statusCode === 201) {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            resolve(body);
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`请求超时 (${this.timeout}ms)`));
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getToken() {
        // 实现token获取逻辑
        // 这里可以返回已缓存的token或获取新token
        return process.env.FEISHU_TOKEN || 'your_token_here';
    }
}

/**
 * 方案2: 使用feishu-post的超时配置
 * 适用于：通过feishu-post发送消息
 */
async function sendFeishuMessageSafe(msg, card, timeout = 60000) {
    try {
        const { stdout } = await exec(
            `node skills/feishu-post/index.js "${msg.replace(/"/g, '\\"')}"`,
            {
                timeout: timeout,
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            }
        );

        console.log('✓ 飞书消息发送成功');
        return { success: true, output: stdout };
    } catch (error) {
        if (error.killed) {
            console.error(`✗ 飞书消息发送超时（${timeout}ms）`);
            return { success: false, error: 'timeout', killed: true };
        } else {
            console.error('✗ 飞书消息发送失败:', error.message);
            return { success: false, error: error.message };
        }
    }
}

/**
 * 方案3: 批量处理，避免单次请求过大
 */
async function batchFeishuOperation(items, batchSize = 50) {
    const results = [];
    const totalBatches = Math.ceil(items.length / batchSize);

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;

        console.log(`处理批次 ${batchNum}/${totalBatches} (${batch.length} 项)`);

        try {
            const client = new FeishuAPIClient();
            const result = await client.request('POST', '/open-apis/bitable/v1/apps/:app_id/tables/:table_id/records/batch_create', {
                records: batch
            });

            results.push(...result.data.records);

            // 批次间延迟，避免触发限流
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`批次 ${batchNum} 失败:`, error.message);
            throw error;
        }
    }

    return results;
}

/**
 * 方案4: 带降级的API调用
 */
async function callFeishuWithFallback(primaryAPI, fallbackAPI, params) {
    try {
        const client = new FeishuAPIClient();
        return await client.request('POST', primaryAPI, params);
    } catch (error) {
        console.warn('主API失败，尝试备用方案:', error.message);

        // 尝试备用方案
        try {
            const client = new FeishuAPIClient();
            return await client.request('POST', fallbackAPI, params);
        } catch (fallbackError) {
            console.error('备用API也失败:', fallbackError.message);
            throw new Error(`所有API调用失败: ${fallbackError.message}`);
        }
    }
}

/**
 * 使用示例
 */
async function exampleUsage() {
    const client = new FeishuAPIClient();

    // 示例1: 创建文档（带超时和重试）
    try {
        const doc = await client.request('POST', '/open-apis/docx/v1/documents', {
            title: '测试文档',
            folder_token: 'xxx'
        });
        console.log('文档创建成功:', doc);
    } catch (error) {
        console.error('文档创建失败:', error.message);
    }

    // 示例2: 发送消息（安全模式）
    const result = await sendFeishuMessageSafe('测试消息');
    if (result.success) {
        console.log('消息发送成功');
    } else {
        console.error('消息发送失败:', result.error);
    }

    // 示例3: 批量操作
    const largeDataset = Array.from({ length: 200 }, (_, i) => ({
        fields: { name: `记录${i}` }
    }));

    try {
        const results = await batchFeishuOperation(largeDataset, 50);
        console.log(`批量操作完成，处理了 ${results.length} 条记录`);
    } catch (error) {
        console.error('批量操作失败:', error.message);
    }
}

// 导出供其他模块使用
module.exports = {
    FeishuAPIClient,
    sendFeishuMessageSafe,
    batchFeishuOperation,
    callFeishuWithFallback
};
