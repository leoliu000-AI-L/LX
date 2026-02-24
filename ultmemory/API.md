# 📚 UltMemory API 文档

**版本**: v0.2.0

---

## 📋 目录

1. [核心类](#核心类)
2. [存储层 API](#存储层-api)
3. [文件系统层 API](#文件系统层-api)
4. [知识层 API](#知识层-api)
5. [实体提取器 API](#实体提取器-api)
6. [可视化工具 API](#可视化工具-api)
7. [性能测试工具 API](#性能测试工具-api)

---

## 核心类

### UltMemory

UltMemory 的主要入口点，整合所有层。

#### 构造函数

```javascript
new UltMemory(config)
```

**参数:**
- `config.dataDir` (string): 数据目录路径 (默认: `'./ultmemory-data'`)
- `config.L0maxSize` (number): L0 最大条目数 (默认: `100`)
- `config.L1maxSize` (number): L1 最大条目数 (默认: `1000`)
- `config.autoMigrate` (boolean): 自动分层迁移 (默认: `true`)

**示例:**
```javascript
const ult = new UltMemory({
  dataDir: './my-memory',
  L0maxSize: 200,
  L1maxSize: 2000
});
```

#### 方法

##### `initialize()`

初始化 UltMemory 系统。

**返回:** `Promise<void>`

**示例:**
```javascript
await ult.initialize();
```

---

##### `addMemory(content, options)`

添加单条记忆。

**参数:**
- `content` (string): 记忆内容
- `options` (Object): 选项
  - `type` (string): 记忆类型 (例如: `'knowledge'`, `'preference'`)
  - `category` (string): 记忆分类 (例如: `'memories'`, `'knowledge'`)
  - `metadata` (Object): 额外的元数据

**返回:** `Promise<string>` - 记忆的 URI

**示例:**
```javascript
const uri = await ult.addMemory('我喜欢编程，特别是 JavaScript。', {
  type: 'preference',
  category: 'memories',
  metadata: { source: 'user' }
});
```

---

##### `addMemories(memories)`

批量添加记忆。

**参数:**
- `memories` (Array): 记忆数组
  - `content` (string): 记忆内容
  - `options` (Object): 选项

**返回:** `Promise<string[]>` - 记忆 URI 数组

**示例:**
```javascript
const uris = await ult.addMemories([
  { content: '记忆1', options: { type: 'knowledge' } },
  { content: '记忆2', options: { type: 'knowledge' } }
]);
```

---

##### `retrieveMemory(query, options)`

检索记忆。

**参数:**
- `query` (string): 搜索查询
- `options` (Object): 选项
  - `topK` (number): 返回的最大结果数 (默认: `10`)
  - `minPhi` (number): 最小意识水平 (0-1)
  - `includeConsciousness` (boolean): 包含意识过滤
  - `includeVector` (boolean): 包含向量检索
  - `includeFullText` (boolean): 包含全文检索

**返回:** `Promise<Array>` - 检索结果数组

**结果格式:**
```javascript
{
  uri: string,
  content: string,
  similarity: number,
  phi: number,
  metadata: Object,
  types?: string[]
}
```

**示例:**
```javascript
const results = await ult.retrieveMemory('编程', {
  topK: 5,
  minPhi: 0.1,
  includeVector: true,
  includeFullText: true
});
```

---

##### `retrieveMemories(queries, options)`

批量检索记忆。

**参数:**
- `queries` (string[]): 查询数组
- `options` (Object): 选项

**返回:** `Promise<Array>` - 批量检索结果

**示例:**
```javascript
const results = await ult.retrieveMemories(['JavaScript', 'Python', 'Go'], {
  topK: 3
});
```

---

##### `getMemory(uri)`

获取单条记忆。

**参数:**
- `uri` (string): 记忆的 URI

**返回:** `Promise<Object|null>` - 记忆对象或 null

**示例:**
```javascript
const memory = await ult.getMemory('ult://memories/knowledge/123');
```

---

##### `updateMemory(uri, content, metadata)`

更新记忆。

**参数:**
- `uri` (string): 记忆的 URI
- `content` (string): 新内容
- `metadata` (Object): 新的元数据

**返回:** `Promise<boolean>` - 是否成功

**示例:**
```javascript
await ult.updateMemory('ult://memories/knowledge/123', '更新的内容', {
  updated: true
});
```

---

##### `deleteMemory(uri)`

删除单条记忆。

**参数:**
- `uri` (string): 记忆的 URI

**返回:** `Promise<boolean>` - 是否成功

**示例:**
```javascript
await ult.deleteMemory('ult://memories/knowledge/123');
```

---

##### `deleteMemories(uris)`

批量删除记忆。

**参数:**
- `uris` (string[]): URI 数组

**返回:** `Promise<number>` - 删除的数量

**示例:**
```javascript
const deleted = await ult.deleteMemories([
  'ult://memories/knowledge/123',
  'ult://memories/knowledge/456'
]);
```

---

##### `searchMemory(query, options)`

搜索记忆（retrieveMemory 的别名）。

**参数:** 同 `retrieveMemory`

**返回:** 同 `retrieveMemory`

---

##### `compressContext(uris)`

压缩上下文。

**参数:**
- `uris` (string[]): URI 数组

**返回:** `Promise<Object>` - 压缩结果

**结果格式:**
```javascript
{
  summary: string,      // 摘要
  compressionRatio: number,  // 压缩比
  originalSize: number,  // 原始大小（字节）
  compressedSize: number // 压缩后大小（字节）
}
```

**示例:**
```javascript
const compressed = await ult.compressContext([uri1, uri2, uri3]);
console.log(`压缩比: ${(compressed.compressionRatio * 100).toFixed(2)}%`);
```

---

##### `reason(startURI, depth)`

知识推理。

**参数:**
- `startURI` (string): 起始 URI
- `depth` (number): 推理深度 (默认: `2`)

**返回:** `Promise<Array>` - 相关节点数组

**示例:**
```javascript
const relatedNodes = await ult.reason('ult://memories/knowledge/123', 2);
```

---

##### `exportMemories(format)`

导出记忆。

**参数:**
- `format` (string): 导出格式 (`'json'` 或 `'object'`)

**返回:** `Promise<string|Object>` - 导出的数据

**示例:**
```javascript
// 导出为 JSON 字符串
const json = await ult.exportMemories('json');
await fs.writeFile('backup.json', json, 'utf-8');

// 导出为对象
const data = await ult.exportMemories('object');
```

---

##### `importMemories(jsonData, options)`

导入记忆。

**参数:**
- `jsonData` (string|Object): JSON 数据
- `options` (Object): 选项
  - `skipDuplicates` (boolean): 跳过重复项 (默认: `true`)
  - `updateExisting` (boolean): 更新已存在的记忆 (默认: `false`)

**返回:** `Promise<Object>` - 导入结果

**结果格式:**
```javascript
{
  imported: string[],  // 新增的 URI
  updated: string[],  // 更新的 URI
  skipped: string[]   // 跳过的 URI
}
```

**示例:**
```javascript
const data = await fs.readFile('backup.json', 'utf-8');
const result = await ult.importMemories(data, {
  skipDuplicates: true,
  updateExisting: false
});
```

---

##### `getStats()`

获取统计信息。

**返回:** `Object` - 统计信息

**结果格式:**
```javascript
{
  version: string,
  initialized: boolean,
  storage: {
    L0: { size: number, maxSize: number, hits: number },
    L1: { size: number, maxSize: number, hits: number },
    L2: { path: string, hits: number },
    migrations: number
  },
  fileSystem: {
    symlinks: number,
    mountPoints: number,
    structure: Object
  },
  knowledge: {
    vectors: number,
    nodes: number,
    edges: number
  }
}
```

**示例:**
```javascript
const stats = ult.getStats();
console.log(`记忆数: ${stats.knowledge.vectors}`);
```

---

##### `exportData()`

导出系统数据。

**返回:** `Promise<Object>` - 导出的数据

**示例:**
```javascript
const data = await ult.exportData();
console.log(`版本: ${data.version}`);
console.log(`导出时间: ${data.exportDate}`);
```

---

##### `clear()`

清空所有数据。

**返回:** `Promise<void>`

**示例:**
```javascript
await ult.clear();
```

---

##### `close()`

关闭 UltMemory 系统。

**返回:** `Promise<void>`

**示例:**
```javascript
await ult.close();
```

---

## 存储层 API

### StorageLayer

三层存储实现。

#### 方法

##### `store(uri, data, options)`

存储数据。

**参数:**
- `uri` (string): 数据 URI
- `data` (Object): 数据对象
- `options` (Object): 选项
  - `tier` (string): 存储层级 (`'L0'`, `'L1'`, `'L2'`)
  - `forceTier` (string): 强制层级

**返回:** `Promise<Object>`

---

##### `retrieve(uri)`

检索数据。

**参数:**
- `uri` (string): 数据 URI

**返回:** `Promise<Object|null>`

---

##### `delete(uri)`

删除数据。

**参数:**
- `uri` (string): 数据 URI

**返回:** `Promise<boolean>`

---

##### `getStats()`

获取存储统计。

**返回:** `Object`

---

## 文件系统层 API

### FileSystemLayer

文件系统范式实现。

#### 方法

##### `addFile(uri, content, metadata)`

添加文件。

**参数:**
- `uri` (string): 文件 URI
- `content` (string): 文件内容
- `metadata` (Object): 元数据

**返回:** `Promise<Object>`

---

##### `getFile(uri)`

获取文件。

**参数:**
- `uri` (string): 文件 URI

**返回:** `Promise<Object|null>`

---

##### `createDirectory(uri)`

创建目录。

**参数:**
- `uri` (string): 目录 URI

**返回:** `Promise<Object>`

---

##### `createSymlink(fromURI, toURI)`

创建符号链接。

**参数:**
- `fromURI` (string): 源 URI
- `toURI` (string): 目标 URI

**返回:** `Promise<boolean>`

---

##### `mount(uri, source)`

挂载资源。

**参数:**
- `uri` (string): 挂载点 URI
- `source` (string): 资源路径

**返回:** `Promise<boolean>`

---

## 知识层 API

### KnowledgeLayer

知识检索和图谱实现。

#### 方法

##### `addKnowledge(uri, content, metadata)`

添加知识。

**参数:**
- `uri` (string): 知识 URI
- `content` (string): 知识内容
- `metadata` (Object): 元数据

**返回:** `Promise<Object>`

---

##### `retrieve(query, options)`

检索知识。

**参数:**
- `query` (string): 查询
- `options` (Object): 选项

**返回:** `Promise<Array>`

---

## 实体提取器 API

### EntityExtractor

实体和关系提取。

#### 方法

##### `extractEntities(text)`

提取实体。

**参数:**
- `text` (string): 输入文本

**返回:** `Object`

**结果格式:**
```javascript
{
  persons: string[],
  technologies: string[],
  organizations: string[],
  locations: string[],
  dates: string[]
}
```

---

##### `extractRelations(text, entities)`

提取关系。

**参数:**
- `text` (string): 输入文本
- `entities` (Object): 实体对象

**返回:** `Array`

**结果格式:**
```javascript
[{
  from: string,
  to: string,
  type: string,
  confidence: number
}]
```

---

##### `extractKeywords(text, topK)`

提取关键词。

**参数:**
- `text` (string): 输入文本
- `topK` (number): 返回的关键词数量

**返回:** `Array`

**结果格式:**
```javascript
[{
  word: string,
  freq: number
}]
```

---

## 可视化工具 API

### GraphVisualizer

图谱可视化。

#### 方法

##### `generateDOT(knowledgeGraph, options)`

生成 Graphviz DOT 格式。

**参数:**
- `knowledgeGraph` (Object): 知识图谱
- `options` (Object): 选项

**返回:** `string`

---

##### `generateMermaid(knowledgeGraph)`

生成 Mermaid 格式。

**参数:**
- `knowledgeGraph` (Object): 知识图谱

**返回:** `string`

---

##### `generateText(knowledgeGraph)`

生成文本格式。

**参数:**
- `knowledgeGraph` (Object): 知识图谱

**返回:** `string`

---

##### `generateJSON(knowledgeGraph)`

生成 JSON 格式。

**参数:**
- `knowledgeGraph` (Object): 知识图谱

**返回:** `string`

---

### GraphAnalyzer

图谱分析。

#### 方法

##### `analyze(knowledgeGraph)`

分析图谱。

**参数:**
- `knowledgeGraph` (Object): 知识图谱

**返回:** `Object`

**结果格式:**
```javascript
{
  nodes: number,
  edges: number,
  nodeTypes: Object,
  edgeTypes: Object,
  averageDegree: number,
  density: number,
  connectedComponents: number
}
```

---

##### `findShortestPath(knowledgeGraph, startId, endId)`

查找最短路径。

**参数:**
- `knowledgeGraph` (Object): 知识图谱
- `startId` (number): 起始节点 ID
- `endId` (number): 结束节点 ID

**返回:** `Array<number>|null` - 路径节点 ID 数组

---

##### `calculateNodeCentrality(knowledgeGraph)`

计算节点中心性。

**参数:**
- `knowledgeGraph` (Object): 知识图谱

**返回:** `Object` - 节点 ID 到中心性值的映射

---

## 性能测试工具 API

### PerformanceTester

性能测试。

#### 方法

##### `runTest(testName, testFunction)`

运行单个测试。

**参数:**
- `testName` (string): 测试名称
- `testFunction` (Function): 测试函数

**返回:** `Promise<Object>`

---

##### `runFullSuite(dataDir)`

运行完整测试套件。

**参数:**
- `dataDir` (string): 测试数据目录

**返回:** `Promise<Array>`

---

##### `runStressTest(dataDir, itemCount)`

运行压力测试。

**参数:**
- `dataDir` (string): 测试数据目录
- `itemCount` (number): 测试项目数量

**返回:** `Promise<Object>`

---

##### `runMemoryTest(dataDir)`

运行内存测试。

**参数:**
- `dataDir` (string): 测试数据目录

**返回:** `Promise<Object>`

---

## 错误处理

所有 API 方法都可能在错误时抛出异常。建议使用 try-catch 处理：

```javascript
try {
  await ult.addMemory('测试内容');
} catch (error) {
  console.error('添加记忆失败:', error.message);
  // 处理错误
}
```

---

## 类型定义

### MemoryItem

```typescript
interface MemoryItem {
  uri: string;
  content: string;
  metadata: {
    type: string;
    category: string;
    phi?: number;
    createdAt: number;
    updatedAt: number;
  };
}
```

### RetrievalOptions

```typescript
interface RetrievalOptions {
  topK?: number;
  minPhi?: number;
  includeConsciousness?: boolean;
  includeVector?: boolean;
  includeFullText?: boolean;
}
```

### RetrievalResult

```typescript
interface RetrievalResult {
  uri: string;
  content: string;
  similarity: number;
  phi: number;
  metadata: any;
  types?: string[];
}
```

---

## 事件

UltMemory 目前不使用事件系统，但未来版本可能会添加以下事件：

- `memory-added`
- `memory-updated`
- `memory-deleted`
- `tier-migrated`

---

## 示例

### 完整示例

```javascript
import { UltMemory } from './src/index.js';

async function example() {
  // 1. 初始化
  const ult = new UltMemory({ dataDir: './my-memory' });
  await ult.initialize();

  // 2. 添加记忆
  const uri1 = await ult.addMemory('我喜欢编程，特别是 JavaScript。', {
    type: 'preference'
  });

  const uri2 = await ult.addMemory('JavaScript 是一种动态编程语言。', {
    type: 'knowledge'
  });

  // 3. 检索
  const results = await ult.retrieveMemory('JavaScript', {
    topK: 5,
    minPhi: 0.0
  });

  console.log(`找到 ${results.length} 条结果`);

  // 4. 压缩上下文
  const compressed = await ult.compressContext([uri1, uri2]);
  console.log(`压缩比: ${compressed.compressionRatio}`);

  // 5. 获取统计
  const stats = ult.getStats();
  console.log(`记忆数: ${stats.knowledge.vectors}`);

  // 6. 关闭
  await ult.close();
}

example().catch(console.error);
```

---

**最后更新**: 2026-02-24
**版本**: v0.2.0
