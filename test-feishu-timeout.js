/**
 * 飞书API超时处理测试脚本
 */

const fs = require('fs');
const path = require('path');

// 导入超时修复模块
const feishuWrapper = require('./evolver-main/scripts/feishu-timeout-wrapper');

/**
 * 测试1: 短超时测试（模拟超时场景）
 */
async function testShortTimeout() {
    console.log('\n🧪 测试1: 短超时测试\n');

    try {
        // 设置一个很短的超时时间来模拟超时场景
        const result = await feishuWrapper.execWithTimeout(
            'node -e "console.log(\'开始\'); setTimeout(() => console.log(\'结束\'), 10000);"',
            {},
            2000,  // 2秒超时（肯定超时）
            1      // 只重试1次
        );

        console.log('✓ 测试通过（不应该到这里）');
        return true;

    } catch (error) {
        console.log(`✓ 预期的超时错误: ${error.message}`);
        return false;
    }
}

/**
 * 测试2: 正常超时测试（应该成功）
 */
async function testNormalTimeout() {
    console.log('\n🧪 测试2: 正常超时测试\n');

    try {
        const result = await feishuWrapper.execWithTimeout(
            'node -e "console.log(\'快速执行完成\');"',
            {},
            5000,  // 5秒超时（应该足够）
            2
        );

        console.log('✓ 命令快速执行完成');
        console.log(`输出: ${result.stdout.trim()}`);
        return true;

    } catch (error) {
        console.log(`✗ 意外的失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试3: 飞书消息发送测试
 */
async function testFeishuMessage() {
    console.log('\n🧪 测试3: 飞书消息发送测试\n');

    try {
        const result = await feishuWrapper.sendFeishuMessageSafe(
            '🧪 飞书API超时测试 - ' + new Date().toLocaleTimeString()
        );

        if (result.skipped) {
            console.log('ℹ️  飞书模块未安装，跳过测试');
            return 'skipped';
        }

        console.log('✓ 飞书消息发送成功');
        return 'success';

    } catch (error) {
        console.log(`✗ 飞书消息发送失败: ${error.message}`);
        return 'failed';
    }
}

/**
 * 测试4: 批量发送测试
 */
async function testBatchSend() {
    console.log('\n🧪 测试4: 批量发送测试\n');

    const messages = [
        '🧪 批量测试 1/3',
        '🧪 批量测试 2/3',
        '🧪 批量测试 3/3'
    ];

    try {
        const results = await feishuWrapper.batchSendFeishuMessages(
            messages,
            2,  // 每批2条
            500  // 批次间延迟500ms
        );

        const successCount = results.filter(r => r.success).length;
        console.log(`✓ 批量发送完成: ${successCount}/${results.length} 成功`);

        return successCount === results.length;

    } catch (error) {
        console.log(`✗ 批量发送失败: ${error.message}`);
        return false;
    }
}

/**
 * 测试5: API监控测试
 */
async function testAPIMonitor() {
    console.log('\n🧪 测试5: API监控测试\n');

    const monitor = new feishuWrapper.FeishuAPIMonitor();

    // 模拟几次API调用
    await monitor.monitoredCall(
        () => feishuWrapper.sendFeishuMessageSafe('监控测试消息1'),
        { operation: 'test', context: 'monitor_test' }
    );

    await monitor.monitoredCall(
        () => feishuWrapper.sendFeishuMessageSafe('监控测试消息2'),
        { operation: 'test', context: 'monitor_test' }
    );

    // 打印统计
    monitor.printStats();

    return true;
}

/**
 * 测试6: 重试机制测试
 */
async function testRetryMechanism() {
    console.log('\n🧪 测试6: 重试机制测试\n');

    try {
        // 故意使用一个会失败的命令来测试重试
        const result = await feishuWrapper.execWithTimeout(
            'node -e "process.exit(1);"',  // 总是失败的命令
            {},
            3000,
            3
        );

        console.log('✓ 不应该到这里');
        return false;

    } catch (error) {
        console.log(`✓ 重试机制工作正常: ${error.message}`);
        return true;
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('='.repeat(60));
    console.log('🧪 飞书API超时处理测试套件');
    console.log('='.repeat(60));

    const tests = [
        { name: '短超时测试', fn: testShortTimeout },
        { name: '正常超时测试', fn: testNormalTimeout },
        { name: '飞书消息测试', fn: testFeishuMessage },
        { name: '批量发送测试', fn: testBatchSend },
        { name: 'API监控测试', fn: testAPIMonitor },
        { name: '重试机制测试', fn: testRetryMechanism }
    ];

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();

            if (result === 'skipped') {
                skipped++;
            } else if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`✗ 测试异常: ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(60));
    console.log(`✓ 通过: ${passed}`);
    console.log(`✗ 失败: ${failed}`);
    console.log(`⊘ 跳过: ${skipped}`);
    console.log(`📊 总计: ${tests.length}`);
    console.log('='.repeat(60));

    return {
        total: tests.length,
        passed,
        failed,
        skipped,
        successRate: tests.length > 0 ? (passed / tests.length * 100).toFixed(1) : 0
    };
}

// 主函数
async function main() {
    try {
        const results = await runAllTests();

        if (results.failed === 0) {
            console.log('\n🎉 所有测试通过！');
        } else {
            console.log(`\n⚠️  有 ${results.failed} 个测试失败，请检查`);
        }

        // 保存测试结果
        const testResults = {
            timestamp: new Date().toISOString(),
            results,
            environment: {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version
            }
        };

        const fs = require('fs');
        fs.writeFileSync(
            'feishu-timeout-test-results.json',
            JSON.stringify(testResults, null, 2)
        );
        console.log('\n📝 测试结果已保存到 feishu-timeout-test-results.json');

    } catch (error) {
        console.error('❌ 测试套件执行失败:', error);
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runAllTests };
