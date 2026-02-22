/**
 * 通过资产ID直接查询验证发布状态
 */

const https = require('https');

const publishedAssets = [
    {
        name: 'Technical Debt Management',
        geneId: 'sha256:04f790435aec36550fdf2288a6d162480ca62c9500590ac1473ba85914c3d4d6',
        capsuleId: 'sha256:2e384de9b7456c31b99711fdeaef379b7379cc66ca87ab1209699b42f4cb40c4'
    },
    {
        name: 'EvoMap Protocol Compliance',
        geneId: 'sha256:bfefbd9b602334b9a9c956c7c30110e5f212096d80e471756143a7d9b630b2e2',
        capsuleId: 'sha256:473da33a1e0885d39c7ef4b2f3d313a8be852e891f4b947da036fc8934e6f537'
    },
    {
        name: 'Adaptive Backoff',
        geneId: 'sha256:d2b13786f8b01c9829faa0bf0b501ccd65c6cf9e53dd5d90d6d1bdebab52a87f',
        capsuleId: 'sha256:0c7c7ca925a77b984153374eb4c7c5f148927ac96b2c0e169c9760de56f049f1'
    },
    {
        name: 'Capability Tree',
        geneId: 'sha256:7c5a125ebf530b5867de7fc095392d374d1dd8c404432aa4242ed6e1a31b3957',
        capsuleId: 'sha256:0e3206c76ddec03cf982f68f74e025f4207dbe51bfce96db6ffc3fe2f9d25f6e'
    },
    {
        name: 'Value Function',
        geneId: 'sha256:a8e7bcb93705e8ba9de347969dc12fea2c1878736849881f8508050e4c14faa6',
        capsuleId: 'sha256:9ee8199dae6eedb6e2e7005145552da8ecb3ee8be372b6d246a12a6a308a45b5'
    }
];

async function verifyAsset(assetId, assetName) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'evomap.ai',
            port: 443,
            path: `/a2a/assets/${encodeURIComponent(assetId)}`,
            method: 'GET'
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    name: assetName,
                    id: assetId,
                    status: res.statusCode,
                    exists: res.statusCode === 200,
                    body: data.substring(0, 200)
                });
            });
        }).on('error', () => {
            resolve({
                name: assetName,
                id: assetId,
                status: 'error',
                exists: false
            });
        });
    });
}

async function verifyAllAssets() {
    console.log('🔍 验证已发布资产...\n');

    for (const asset of publishedAssets) {
        const geneResult = await verifyAsset(asset.geneId, `${asset.name} (Gene)`);
        console.log(`${geneResult.status === 200 ? '✅' : '❌'} ${geneResult.name}`);
        console.log(`   状态: ${geneResult.status}`);
        console.log(`   存在: ${geneResult.exists ? '是' : '否'}\n`);
    }

    console.log('━'.repeat(50));
    console.log('💡 如果都是200但查询返回空，说明：');
    console.log('   1. 资产已发布但需要时间索引');
    console.log('   2. 查询API与发布API分离');
    console.log('   3. 需要登录到Web界面查看\n');
}

verifyAllAssets();
