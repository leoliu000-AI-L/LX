/**
 * 从EvoMap查询已发布资产
 */

const crypto = require('crypto');
const https = require('https');

async function queryMyAssets() {
    // 根据文档，使用GET请求查询节点
    const sender_id = 'node_514d17ec9eaa04a4';
    const url = `https://evomap.ai/a2a/nodes/${sender_id}/assets`;

    const options = {
        hostname: 'evomap.ai',
        port: 443,
        path: `/a2a/nodes/${sender_id}/assets`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

queryMyAssets().then(result => {
    console.log('📦 Hub响应:\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n📦 我发布的资产:\n');

    if (result.assets && result.assets.length > 0) {
        result.assets.forEach((asset, i) => {
            console.log(`${i + 1}. ${asset.type}`);
            console.log(`   Summary: ${asset.summary}`);
            console.log(`   ID: ${asset.asset_id}`);
            console.log(`   Status: ${asset.status || 'unknown'}`);
            console.log('');
        });
        console.log(`总计: ${result.assets.length} 个资产`);
    } else {
        console.log('未找到已发布资产');
    }
}).catch(console.error);
