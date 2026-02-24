/**
 * UltMemory 知识图谱可视化演示
 * 展示图谱分析和可视化功能
 */

import { UltMemory } from '../src/index.js';
import { GraphVisualizer, GraphAnalyzer } from '../src/utils/graph-visualizer.js';
import fs from 'fs/promises';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  UltMemory - 知识图谱可视化演示');
  console.log('  图谱分析 + 可视化生成');
  console.log('='.repeat(70) + '\n');

  const ult = new UltMemory({
    dataDir: './ultmemory-graph-viz-demo'
  });

  await ult.initialize();

  // 添加复杂的知识网络
  console.log('📚 步骤 1: 构建知识网络\n');

  const knowledgeNetwork = [
    'Leo 是一名软件工程师，在 Google 工作。',
    'Leo 擅长 JavaScript 和 Python。',
    'Google 开发了 TensorFlow 和 Go 语言。',
    'TensorFlow 用于机器学习和深度学习。',
    'Python 是 AI 和机器学习的主要语言。',
    'JavaScript 是 Web 开发的主流语言。',
    'Go 语言以其高性能和并发特性著称。',
    'Microsoft 开发了 TypeScript 和 Azure AI。',
    'TypeScript 是 JavaScript 的超集。',
    'OpenAI 开发了 GPT 系列，总部位于旧金山。',
    'GPT-4 是最先进的大语言模型之一。',
    '旧金山是硅谷的一部分，科技公司的聚集地。'
  ];

  for (const knowledge of knowledgeNetwork) {
    await ult.addMemory(knowledge, { type: 'knowledge' });
    console.log(`✓ 添加: ${knowledge.substring(0, 40)}...`);
  }

  // 获取知识图谱
  const stats = ult.getStats();
  console.log(`\n知识图谱统计:`);
  console.log(`  节点数: ${stats.knowledge.nodes}`);
  console.log(`  边数: ${stats.knowledge.edges}`);

  // 创建可视化工具
  const visualizer = new GraphVisualizer();
  const analyzer = new GraphAnalyzer();

  // 步骤 2: 生成 Graphviz DOT 格式
  console.log('\n📊 步骤 2: 生成 Graphviz DOT 格式\n');

  // 需要访问内部的 knowledgeGraph
  const knowledgeGraph = ult.knowledge.knowledgeGraph;

  const dotFormat = visualizer.generateDOT(knowledgeGraph, {
    title: 'UltMemory Knowledge Graph',
    layout: 'dot',
    nodeShape: 'box',
    showLabels: true
  });

  const dotFile = 'knowledge-graph.dot';
  await fs.writeFile(dotFile, dotFormat, 'utf-8');
  console.log(`✓ 生成 Graphviz DOT 文件: ${dotFile}`);
  console.log(`  可以使用以下命令查看:`);
  console.log(`  dot -Tpng ${dotFile} -o graph.png`);

  // 步骤 3: 生成 Mermaid 格式
  console.log('\n📊 步骤 3: 生成 Mermaid 格式\n');

  const mermaidFormat = visualizer.generateMermaid(knowledgeGraph);

  const mermaidFile = 'knowledge-graph.mmd';
  await fs.writeFile(mermaidFile, mermaidFormat, 'utf-8');
  console.log(`✓ 生成 Mermaid 文件: ${mermaidFile}`);
  console.log(`  可以在 Mermaid Live Editor 中查看:`);
  console.log(`  https://mermaid.live/`);

  // 步骤 4: 生成文本格式
  console.log('\n📊 步骤 4: 生成文本格式\n');

  const textFormat = visualizer.generateText(knowledgeGraph);
  console.log(textFormat);

  // 步骤 5: 图谱分析
  console.log('📊 步骤 5: 图谱分析\n');

  const graphStats = analyzer.analyze(knowledgeGraph);

  console.log('图谱统计:');
  console.log(`  节点数: ${graphStats.nodes}`);
  console.log(`  边数: ${graphStats.edges}`);
  console.log(`  平均度: ${graphStats.averageDegree.toFixed(2)}`);
  console.log(`  密度: ${graphStats.density.toFixed(3)}`);
  console.log(`  连通分量: ${graphStats.connectedComponents}`);

  console.log('\n节点类型分布:');
  for (const [type, count] of Object.entries(graphStats.nodeTypes)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\n边类型分布:');
  for (const [type, count] of Object.entries(graphStats.edgeTypes)) {
    console.log(`  ${type}: ${count}`);
  }

  // 步骤 6: 路径查找
  console.log('\n🔍 步骤 6: 路径查找\n');

  // 查找 Leo 到 GPT-4 的路径
  const leoNode = analyzer.findNodeByName(knowledgeGraph, 'Leo');
  const gptNode = analyzer.findNodeByName(knowledgeGraph, 'GPT-4');

  if (leoNode && gptNode) {
    const path = analyzer.findShortestPath(knowledgeGraph, leoNode, gptNode);

    if (path) {
      console.log(`从 Leo 到 GPT-4 的最短路径 (长度 ${path.length}):`);
      for (let i = 0; i < path.length; i++) {
        const node = knowledgeGraph.nodes.get(path[i]);
        const label = node.name || node.data?.content?.substring(0, 30) || `Node ${path[i]}`;
        console.log(`  ${i + 1}. ${label}`);
      }
    } else {
      console.log('未找到从 Leo 到 GPT-4 的路径');
    }
  }

  // 步骤 7: 中心性分析
  console.log('\n🎯 步骤 7: 节点中心性分析\n');

  const centralities = analyzer.calculateNodeCentrality(knowledgeGraph);
  const sorted = Object.entries(centralities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('Top 5 最重要的节点:');
  for (const [nodeId, centrality] of sorted) {
    const node = knowledgeGraph.nodes.get(parseInt(nodeId));
    const label = node.name || node.data?.content?.substring(0, 30) || `Node ${nodeId}`;
    console.log(`  ${label} (中心性: ${centrality.toFixed(3)})`);
  }

  // 步骤 8: 生成 JSON 格式
  console.log('\n📊 步骤 8: 生成 JSON 格式\n');

  const jsonFormat = visualizer.generateJSON(knowledgeGraph);

  const jsonFile = 'knowledge-graph.json';
  await fs.writeFile(jsonFile, jsonFormat, 'utf-8');
  console.log(`✓ 生成 JSON 文件: ${jsonFile}`);

  // 关闭
  await ult.close();

  console.log('\n' + '='.repeat(70));
  console.log('  知识图谱可视化演示完成!');
  console.log('='.repeat(70));
  console.log('\n生成的文件:');
  console.log(`  - ${dotFile} (Graphviz DOT 格式)`);
  console.log(`  - ${mermaidFile} (Mermaid 格式)`);
  console.log(`  - ${jsonFile} (JSON 格式)`);
  console.log('\n可以使用以下工具查看:');
  console.log('  1. Graphviz: dot -Tpng knowledge-graph.dot -o graph.png');
  console.log('  2. Mermaid Live Editor: https://mermaid.live/');
  console.log('  3. 任何 JSON 查看器\n');
}

// 辅助函数: 根据名称查找节点
GraphAnalyzer.prototype.findNodeByName = function(graph, name) {
  for (const [id, node] of graph.nodes.entries()) {
    if (node.name === name || (node.data && node.data.content && node.data.content.includes(name))) {
      return id;
    }
  }
  return null;
};

// 计算节点中心性
GraphAnalyzer.prototype.calculateNodeCentrality = function(graph) {
  const centralities = {};

  // 度中心性
  for (const [id, node] of graph.nodes.entries()) {
    let degree = 0;
    for (const edge of graph.edges.values()) {
      if (edge.from === id || edge.to === id) {
        degree++;
      }
    }
    centralities[id] = degree;
  }

  return centralities;
};

// 运行演示
main()
  .then(() => {
    console.log('✓ 演示成功完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ 演示失败:', error);
    process.exit(1);
  });
