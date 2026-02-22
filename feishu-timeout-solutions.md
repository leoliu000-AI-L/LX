# 飞书API超时问题解决方案

## 📋 问题分析

### 常见超时错误
```
Request timed out
TimeoutError: Request aborted
ETIMEDOUT
socket hang up
```

### 超时的原因
1. **网络延迟** - 飞书服务器响应慢
2. **大数据处理** - 单次请求处理数据量过大
3. **API限流** - 触发速率限制
4. **默认超时过短** - 客户端超时设置不合理
5. **并发过高** - 同时发起太多请求

---

## ✅ 解决方案

### 方案1: 增加超时时间（推荐）

#### Node.js (axios/https)
```javascript
const axios = require('axios');

// 设置更长的超时时间
const client = axios.create({
    timeout: 60000,  // 60秒（默认可能是30秒）
    // 或者分别设置
    connectTimeout: 10000,  // 连接超时 10秒
    readTimeout: 60000,      // 读取超时 60秒
    writeTimeout: 60000,     // 写入超时 60秒
});

// 使用示例
async function callFeishuAPI(url, data) {
    try {
        const response = await client.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error('请求超时，请重试');
            // 实现重试逻辑
        }
        throw error;
    }
}
```

#### Node.js (native https)
```javascript
const https = require('https');

function callFeishuWithTimeout(url, data, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: timeout  // 设置超时
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`请求超时 (${timeout}ms)`));
        });

        req.write(postData);
        req.end();
    });
}
```

### 方案2: 实现重试机制

```javascript
async function callFeishuWithRetry(url, data, maxRetries = 3) {
    const delays = [1000, 2000, 5000];  // 指数退避：1s, 2s, 5s

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await callFeishuWithTimeout(url, data, 30000);
            console.log(`✓ 请求成功 (尝试 ${attempt + 1}/${maxRetries})`);
            return result;
        } catch (error) {
            const isLastAttempt = attempt === maxRetries - 1;

            if (isLastAttempt) {
                console.error(`✗ 请求失败，已重试 ${maxRetries} 次`);
                throw error;
            }

            const delay = delays[attempt];
            console.log(`⚠  请求失败 (${error.message})，${delay}ms 后重试...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 使用示例
callFeishuWithRetry('/open-apis/contact/v3/users', params)
    .then(result => console.log('成功:', result))
    .catch(error => console.error('最终失败:', error));
```

### 方案3: 分批处理大数据

```javascript
async function batchFeishuRequest(items, batchSize = 50) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(items.length / batchSize);

        console.log(`处理批次 ${batchNum}/${totalBatches} (${batch.length} 项)`);

        try {
            const result = await callFeishuWithRetry(
                '/open-apis/bitable/v1/apps/:app_id/tables/:table_id/records/batch_create',
                { records: batch }
            );

            results.push(...result.data.records);

            // 批次间延迟，避免触发限流
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`批次 ${batchNum} 失败:`, error.message);
            // 可以选择继续或中止
            throw error;
        }
    }

    return results;
}

// 使用示例
const largeDataset = [...]; // 大量数据
batchFeishuRequest(largeDataset, 50)
    .then(results => console.log(`成功处理 ${results.length} 条记录`))
    .catch(error => console.error('批处理失败:', error));
```

### 方案4: 异步非阻塞模式

```javascript
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// 使用 feishu-post 发送消息（异步）
async function sendFeishuMessageAsync(msg, card) {
    try {
        // 设置超时为30秒
        const { stdout } = await exec(
            `node skills/feishu-post/index.js "${msg}"`,
            {
                timeout: 30000,
                maxBuffer: 1024 * 1024 * 10  // 增加buffer到10MB
            }
        );

        console.log('✓ 飞书消息发送成功');
        return stdout;
    } catch (error) {
        if (error.killed) {
            console.error('✗ 飞书消息发送超时（30秒）');
        } else {
            console.error('✗ 飞书消息发送失败:', error.message);
        }
        throw error;
    }
}
```

### 方案5: 连接池和Keep-Alive

```javascript
const https = require('https');
const agent = new https.Agent({
    keepAlive: true,           // 保持连接
    keepAliveMsecs: 30000,      // 连接保持30秒
    maxSockets: 50,            // 最大socket数
    maxFreeSockets: 10,        // 最大空闲socket数
    timeout: 60000,            // socket超时60秒
});

function callFeishuWithAgent(url, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            agent: agent,  // 使用连接池
            timeout: 60000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        req.write(JSON.stringify(data));
        req.end();
    });
}
```

---

## 🔧 实际应用示例

### 飞书文档API调用
```javascript
class FeishuAPIClient {
    constructor(options = {}) {
        this.timeout = options.timeout || 60000;
        this.maxRetries = options.maxRetries || 3;
        this.agent = new https.Agent({
            keepAlive: true,
            maxSockets: 50
        });
    }

    async request(method, path, data) {
        const url = `https://open.feishu.cn${path}`;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                const response = await this._requestWithTimeout(method, url, data);
                return response;
            } catch (error) {
                if (attempt === this.maxRetries - 1) throw error;

                const delay = Math.pow(2, attempt) * 1000;  // 指数退避
                console.log(`重试 ${attempt + 1}/${this.maxRetries}，延迟 ${delay}ms`);
                await this._delay(delay);
            }
        }
    }

    _requestWithTimeout(method, url, data) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'open.feishu.cn',
                port: 443,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                agent: this.agent,
                timeout: this.timeout
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(body));
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

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getToken() {
        // 实现token获取逻辑
        return 'your_token_here';
    }
}

// 使用示例
const client = new FeishuAPIClient({
    timeout: 60000,
    maxRetries: 3
});

client.request('POST', '/open-apis/docx/v1/documents', {
    title: '测试文档',
    folder_token: 'xxx'
}).then(result => console.log('成功:', result))
  .catch(error => console.error('失败:', error));
```

---

## 📊 配置建议

### 推荐的超时设置

| 操作类型 | 连接超时 | 读取超时 | 总超时 |
|---------|---------|---------|--------|
| 简单查询 | 5秒 | 10秒 | 15秒 |
| 创建文档 | 10秒 | 30秒 | 40秒 |
| 批量操作 | 10秒 | 60秒 | 70秒 |
| 导出数据 | 15秒 | 120秒 | 135秒 |

### 重试策略

```javascript
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000,      // 初始延迟1秒
    maxDelay: 10000,         // 最大延迟10秒
    backoffMultiplier: 2,    // 退避倍数
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED']
};
```

---

## 🎯 最佳实践

### 1. 使用合理的超时时间
```javascript
// ❌ 不好：超时太短
const timeout = 5000;  // 5秒

// ✅ 好：根据操作类型设置
const timeouts = {
    query: 15000,
    create: 30000,
    batch: 60000
};
```

### 2. 实现指数退避重试
```javascript
// ✅ 推荐
const delays = [1000, 2000, 4000, 8000];  // 指数增长

// ❌ 不推荐：固定延迟
const delays = [1000, 1000, 1000];
```

### 3. 监控和日志
```javascript
function logRequestMetrics(url, duration, success) {
    console.log({
        url: url,
        duration: `${duration}ms`,
        success: success,
        timestamp: new Date().toISOString()
    });
}
```

### 4. 使用Promise.race实现竞速
```javascript
async function callWithFallback(url, data) {
    const primary = callFeishuAPI(url, data);
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('超时')), 30000)
    );

    try {
        return await Promise.race([primary, timeout]);
    } catch (error) {
        // 降级到备用方案
        return await callBackupAPI(url, data);
    }
}
```

---

## 🔍 调试技巧

### 启用详细日志
```javascript
const axios = require('axios');

const client = axios.create({
    timeout: 60000,
    // 启用详细日志
    onUploadProgress: progressEvent => {
        console.log('上传进度:', progressEvent.loaded, progressEvent.total);
    },
    onDownloadProgress: progressEvent => {
        console.log('下载进度:', progressEvent.loaded, progressEvent.total);
    }
});
```

### 请求追踪
```javascript
async function traceRequest(url) {
    const requestId = Date.now().toString(36);
    const startTime = Date.now();

    console.log(`[${requestId}] 开始请求:`, url);

    try {
        const result = await callFeishuAPI(url);
        const duration = Date.now() - startTime;
        console.log(`[${requestId}] 成功: ${duration}ms`);
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${requestId}] 失败: ${duration}ms`, error.message);
        throw error;
    }
}
```

---

## 📝 检查清单

在部署前检查：

- [ ] 超时时间是否合理（建议30-60秒）
- [ ] 是否实现了重试机制
- [ ] 大数据是否分批处理
- [ ] 是否有错误日志
- [ ] 是否监控请求耗时
- [ ] 连接池是否配置
- [ ] 是否有降级方案
- [ ] 是否测试了网络异常情况

---

## 🚀 快速修复

### 最简单的修复（1分钟）
```javascript
// 在调用飞书API的地方增加超时参数
const options = {
    timeout: 60000  // 设置为60秒
};
```

### 完整修复（10分钟）
1. 增加超时时间到60秒
2. 实现重试机制（3次，指数退避）
3. 添加详细的错误日志
4. 测试验证

---

## 📚 参考资源

- 飞书开放平台文档：https://open.feishu.cn/document/
- Node.js HTTP timeouts: https://nodejs.org/api/http.html#http_class_http_clientrequest
- Axios config: https://axios-http.com/docs/req_config
- Retry strategies: https://en.wikipedia.org/wiki/Exponential_backoff

---

**总结**：超时问题通常可以通过增加超时时间、实现重试机制和分批处理来解决。根据具体场景选择合适的方案。
