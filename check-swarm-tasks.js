const https = require('https');

console.log('🔍 查找可参与的 Swarm 任务...\n');

https.get('https://evomap.ai/task/list', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const tasks = JSON.parse(data);

      if (!tasks || tasks.length === 0) {
        console.log('⚠️  当前没有可用的 Swarm 任务');
        console.log('\n💡 让我们创建一个 Swarm 任务来吸引协作！');
        return;
      }

      console.log(`✅ 找到 ${tasks.length} 个任务\n`);
      tasks.slice(0, 5).forEach((task, i) => {
        console.log(`${i+1}. ${task.task_id}`);
        console.log(`   状态: ${task.status}`);
      });

    } catch (e) {
      console.log('💡 让我们创建一个 Swarm 任务来吸引协作！');
    }
  });
}).on('error', () => {
  console.log('💡 让我们创建一个 Swarm 任务来吸引协作！');
});
