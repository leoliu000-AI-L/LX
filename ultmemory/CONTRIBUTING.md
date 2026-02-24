# 🤝 贡献指南

感谢您对 UltMemory 的关注！我们欢迎任何形式的贡献。

## 📋 目录

1. [如何贡献](#如何贡献)
2. [开发环境设置](#开发环境设置)
3. [代码规范](#代码规范)
4. [提交规范](#提交规范)
5. [测试规范](#测试规范)
6. [文档规范](#文档规范)

---

## 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议：

1. 检查 [Issues](https://github.com/your-repo/ultmemory/issues) 是否已存在
2. 如果没有，创建新的 Issue
3. 提供详细的问题描述和复现步骤
4. 包含您的环境信息（Node.js 版本、操作系统等）

### 提交代码

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 fork 项目
   git clone https://github.com/your-username/ultmemory.git
   cd ultmemory
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行开发**
   - 遵循代码规范
   - 添加必要的测试
   - 更新相关文档

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送分支**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 填写 PR 模板
   - 等待代码审查

---

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 或 yarn
- Git

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/ultmemory.git
cd ultmemory

# 安装依赖（如果未来添加）
npm install
```

### 运行测试

```bash
# 基础测试
npm test

# 性能测试
npm run test:perf
```

### 运行演示

```bash
# 基础演示
npm run demo

# 高级演示
npm run demo:advanced

# 导入导出演示
npm run demo:import

# 图谱可视化演示
npm run demo:graph
```

---

## 代码规范

### JavaScript 规范

我们使用 ES6+ 语法和 ESLint 推荐规范：

```javascript
// ✅ 好的做法
import { UltMemory } from './index.js';

async function addMemory(content) {
  const uri = await this.addMemory(content);
  return uri;
}

// ❌ 避免
const UltMemory = require('./index'); // 使用 import

function addMemory(content) { // 使用 async/await
  return this.addMemory(content).then(uri => uri);
}
```

### 命名规范

- **文件名**: kebab-case (例如: `storage-layer.js`)
- **类名**: PascalCase (例如: `StorageLayer`)
- **函数/变量**: camelCase (例如: `addMemory`, `getItem`)
- **常量**: UPPER_SNAKE_CASE (例如: `MAX_SIZE`)

### 注释规范

使用 JSDoc 风格的注释：

```javascript
/**
 * 添加记忆到 UltMemory 系统
 * @param {string} content - 记忆内容
 * @param {Object} options - 选项
 * @param {string} options.type - 记忆类型
 * @param {string} options.category - 记忆分类
 * @returns {Promise<string>} 记忆的 URI
 */
async function addMemory(content, options = {}) {
  // 实现
}
```

---

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```bash
# 新功能
git commit -m "feat(storage): add tiered storage migration"

# 修复 bug
git commit -m "fix(storage): handle empty JSON files gracefully"

# 文档
git commit -m "docs(readme): update installation instructions"

# 性能优化
git commit -m "perf(retrieval): optimize vector search with caching"
```

---

## 测试规范

### 测试结构

```javascript
// tests/example-test.js
import { UltMemory } from '../src/index.js';

async function testFeature() {
  const ult = new UltMemory({ dataDir: './test-data' });
  await ult.initialize();

  // 测试代码
  const uri = await ult.addMemory('测试内容');
  const result = await ult.retrieveMemory('测试');

  if (result.length === 0) {
    throw new Error('测试失败: 未找到结果');
  }

  await ult.close();
}

// 运行测试
testFeature()
  .then(() => console.log('✓ 测试通过'))
  .catch((error) => console.error('✗ 测试失败:', error));
```

### 测试覆盖

- 单元测试: 测试单个函数
- 集成测试: 测试模块间交互
- 性能测试: 测试性能指标
- 压力测试: 测试极限情况

---

## 文档规范

### 代码文档

- 每个模块应有 JSDoc 注释
- 复杂算法应有详细说明
- 使用示例应清晰易懂

### README 文档

- 项目简介
- 快速开始
- API 文档
- 示例代码
- 贡献指南

### API 文档

使用清晰的格式：

```markdown
## API

### `addMemory(content, options)`

添加记忆到系统。

**参数:**
- `content` (string): 记忆内容
- `options` (Object): 选项
  - `type` (string): 记忆类型
  - `category` (string): 记忆分类

**返回:** Promise<string> - 记忆的 URI

**示例:**
```javascript
const uri = await ult.addMemory('我喜欢编程', {
  type: 'preference',
  category: 'memories'
});
```
```

---

## 功能贡献建议

### 期待的功能

- Phase 2: 主动服务层
- Phase 3: 完整的意识层
- Phase 4: 量子通信模块
- Phase 5: 脑机接口集成
- Phase 6: 自我进化能力

### 贡献思路

- 性能优化
- 新的检索算法
- 更好的可视化
- 更多的导入导出格式
- 国际化支持
- 插件系统

---

## 代码审查

所有 PR 都需要经过代码审查：

### 审查清单

- [ ] 代码符合规范
- [ ] 包含必要的测试
- [ ] 文档已更新
- [ ] 测试通过
- [ ] 没有引入新的警告
- [ ] 性能没有明显下降

### 审查流程

1. 自动化测试运行
2. 代码审查
3. 修改建议
4. 批准并合并

---

## 社区准则

### 尊重与包容

- 尊重不同的观点和经验
- 使用欢迎和包容的语言
- 优雅地接受建设性批评
- 关注对社区最有利的事情

### 冲突解决

我们相信健康的讨论和协作能解决问题。请：

- 保持冷静和专业
- 寻求理解
- 寻求妥协
- 请求帮助

---

## 许可证

通过贡献代码，您同意您的贡献将在与项目相同的 [MIT 许可证](LICENSE) 下发布。

---

## 联系方式

- GitHub Issues: https://github.com/your-repo/ultmemory/issues
- Email: your-email@example.com
- Discord: https://discord.gg/your-server

---

**感谢您的贡献！** 🎉
