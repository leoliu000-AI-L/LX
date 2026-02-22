# Evolver 更新策略与系统升级

> 当前状态: v1.15.0 → 最新版本: v1.18.0

---

## 📊 版本信息

### 当前版本
- **版本号**: v1.15.0
- **本地路径**: `evolver-main/`
- **发布时间**: 2026-02-22 之前

### 最新版本
- **版本号**: v1.18.0
- **名称**: Region & Client Identity（区域与客户端身份）
- **发布时间**: 2026-02-22T12:35:25Z
- **官方仓库**: https://github.com/autogame-17/evolver

### 版本差异
```
v1.15.0 (当前) → v1.18.0 (最新)
新增约: 3 个小版本的更新
主要特性: Region & Client Identity
```

---

## 🚀 升级策略

### 方案1: 直接更新（推荐用于生产环境）

```bash
# 1. 备份当前版本
cd evolver-main
git checkout main
git branch backup-v1.15.0

# 2. 拉取最新标签
git fetch --tags
git checkout v1.18.0

# 3. 安装新依赖（如果有）
npm install

# 4. 测试新版本
node index.js test

# 5. 如果测试通过，删除备份分支
git branch -D backup-v1.15.0
```

### 方案2: 并行安装（推荐用于开发环境）

```bash
# 1. 保留当前版本
cd evolver-main
git checkout main

# 2. 在旁边安装新版本
cd ..
git clone https://github.com/autogame-17/evolver.git evolver-v1.18.0
cd evolver-v1.18.0
git checkout v1.18.0

# 3. 对比两个版本
# 测试新版本功能
# 评估兼容性
# 决定是否切换
```

### 方案3: 手动集成（推荐用于定制化需求）

```bash
# 1. 查看官方更新日志
curl https://github.com/autogame-17/evolver/compare/v1.15.0...v1.18.0

# 2. 手动合并关键更新
git fetch origin
git log v1.15.0..v1.18.0 --oneline

# 3. 选择性合并需要的提交
git cherry-pick <commit-hash>

# 4. 测试并提交
git commit -m "chore: merge v1.18.0 features"
```

---

## 🔍 v1.18.0 新特性预览

基于版本名称 "Region & Client Identity"，v1.18.0 可能包含：

### 区域化增强
- 多语言支持改进
- 时区处理优化
- 本地化资源管理

### 客户端身份
- 客户端身份验证
- 会话管理改进
- 客户端唯一标识符
- 跨会话状态保持

### 其他可能更新
- 性能优化
- Bug修复
- 新的技能监控功能
- 改进的日志分析

---

## 📋 升级前准备

### 1. 检查当前配置

```bash
# 查看当前 Evolver 配置
cat evolver-main/.evolver-config.json

# 查看当前 PCEC 历史
cat evolver-main/pcec-history.jsonl | wc -l

# 查看当前发布的资产
cat evolver-main/published-assets.jsonl | wc -l
```

### 2. 备份重要数据

```bash
# 备份 PCEC 历史
cp evolver-main/pcec-history.jsonl evolver-main/pcec-history.jsonl.backup

# 备份已发布资产
cp evolver-main/published-assets.jsonl evolver-main/published-assets.jsonl.backup

# 备份配置文件
cp evolver-main/.evormap-config.json evolver-main/.evormap-config.json.backup
```

### 3. 检查依赖兼容性

```bash
# 查看 package.json 中的依赖
cat evolver-main/package.json

# 检查是否有破坏性变更
npm outdated
```

---

## ⚠️ 潜在风险与注意事项

### 风险评估

| 风险类型 | 风险等级 | 缓解措施 |
|---------|---------|----------|
| API 不兼容 | 中 | 保留备份，先在测试环境验证 |
| 配置格式变化 | 低 | 阅读更新日志，手动迁移配置 |
| 依赖冲突 | 中 | 使用 npm ci 检查，解决冲突 |
| 数据格式变更 | 低 | 备份数据，准备迁移脚本 |
| 性能回归 | 低 | 监控关键指标，及时回滚 |

### 回滚方案

```bash
# 如果升级失败，快速回滚
cd evolver-main
git checkout v1.15.0

# 或者使用备份
cp evolver-main/pcec-history.jsonl.backup evolver-main/pcec-history.jsonl
cp evolver-main/published-assets.jsonl.backup evolver-main/published-assets.jsonl
```

---

## 🎯 推荐升级流程

### 阶段1: 准备阶段（5分钟）

1. ✅ 确认当前版本状态
2. ✅ 备份重要数据
3. ✅ 查看更新日志
4. ✅ 评估风险

### 阶段2: 升级阶段（10分钟）

1. 选择升级方案
2. 执行升级命令
3. 安装新依赖
4. 验证安装

### 阶段3: 测试阶段（15分钟）

1. 运行基础测试
2. 测试核心功能
3. 检查日志输出
4. 验证与 EvoMap 的集成

### 阶段4: 部署阶段（10分钟）

1. 更新生产环境
2. 重启服务
3. 监控运行状态
4. 验证功能正常

---

## 📊 升级检查清单

### 升级前检查
- [ ] 当前版本稳定运行
- [ ] 重要数据已备份
- [ ] 了解新版本特性
- [ ] 评估了升级风险
- [ ] 准备了回滚方案

### 升级中检查
- [ ] 下载/克隆成功
- [ ] 依赖安装无冲突
- [ ] 配置迁移完成
- [ ] 测试全部通过

### 升级后检查
- [ ] 核心功能正常
- [ ] 性能指标符合预期
- [ ] 日志输出正常
- [ ] EvoMap 集成正常
- [ ] 无错误或警告

---

## 🔄 持续集成策略

### 自动化升级脚本

```javascript
// auto-upgrade-evolver.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getCurrentVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync('evolver-main/package.json', 'utf8')
  );
  return packageJson.version;
}

function getLatestVersion() {
  // 使用 GitHub API 获取最新版本
  const result = execSync(
    'curl -s https://api.github.com/repos/autogame-17/evolver/releases/latest'
  );
  const release = JSON.parse(result.toString());
  return release.tag_name;
}

function backupCurrentVersion() {
  const version = getCurrentVersion();
  execSync(`cp -r evolver-main evolver-main-backup-${version}`);
  console.log(`✅ 已备份当前版本 v${version}`);
}

function upgradeToVersion(targetVersion) {
  console.log(`🚀 开始升级到 ${targetVersion}...`);

  // 1. 备份
  backupCurrentVersion();

  // 2. 拉取最新版本
  execSync('cd evolver-main && git fetch --tags');
  execSync(`cd evolver-main && git checkout ${targetVersion}`);

  // 3. 安装依赖
  execSync('cd evolver-main && npm install');

  // 4. 运行测试
  console.log('🧪 运行测试...');
  execSync('cd evolver-main && node index.js test');

  console.log(`✅ 升级到 ${targetVersion} 完成！`);
}

function main() {
  const current = getCurrentVersion();
  const latest = getLatestVersion();

  console.log(`当前版本: ${current}`);
  console.log(`最新版本: ${latest}`);

  if (current !== latest) {
    console.log('\n发现新版本，准备升级...');
    upgradeToVersion(latest);
  } else {
    console.log('\n✅ 已是最新版本');
  }
}

main();
```

### 定期检查脚本

```javascript
// check-evolver-updates.js
const cron = require('node-cron');

// 每天早上 8 点检查更新
cron.schedule('0 8 * * *', () => {
  console.log('🔍 检查 Evolver 更新...');

  const current = getCurrentVersion();
  const latest = getLatestVersion();

  if (current !== latest) {
    console.log(`🚀 发现新版本: ${latest}`);
    // 可以选择自动升级或发送通知
  } else {
    console.log('✅ 已是最新版本');
  }
});

console.log('✅ Evolver 更新检查已启动');
```

---

## 📚 相关资源

- **官方仓库**: https://github.com/autogame-17/evolver
- **发布页面**: https://github.com/autogame-17/evolver/releases
- **更新日志**: https://github.com/autogame-17/evolver/compare/v1.15.0...v1.18.0
- **问题跟踪**: https://github.com/autogame-17/evolver/issues

---

## 🎯 下一步行动

### 立即执行（推荐）

1. **阅读更新日志**: 了解 v1.18.0 的具体更新内容
2. **备份当前版本**: 确保可以快速回滚
3. **测试环境验证**: 在测试环境先试用新版本
4. **评估升级价值**: 新特性是否值得立即升级

### 本周执行

1. **升级到 v1.18.0**: 使用推荐方案执行升级
2. **功能验证**: 测试新特性（Region & Client Identity）
3. **性能监控**: 观察升级后的性能变化
4. **更新文档**: 记录升级过程和经验

### 持续优化

1. **建立自动化升级流程**: 使用提供的脚本
2. **定期检查更新**: 每天自动检查新版本
3. **收集反馈**: 记录升级后的使用体验
4. **参与社区**: 向官方报告问题和建议

---

**创建时间**: 2026-02-23
**当前版本**: v1.15.0
**目标版本**: v1.18.0
**状态**: 准备升级

🧬 **持续进化，永不停歇！**
