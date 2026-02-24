/**
 * 知识图谱可视化工具
 * 生成 Graphviz DOT 格式的图谱可视化
 */

export class GraphVisualizer {
  constructor() {
    this.nodeTypeColors = {
      knowledge: '#3498db',
      identity: '#e74c3c',
      preference: '#2ecc71',
      organization: '#9b59b6',
      technology: '#f39c12',
      location: '#1abc9c',
      entity: '#95a5a6'
    };
  }

  /**
   * 生成 Graphviz DOT 格式
   */
  generateDOT(knowledgeGraph, options = {}) {
    const {
      title = 'UltMemory Knowledge Graph',
      layout = 'dot',
      nodeShape = 'box',
      showLabels = true
    } = options;

    let dot = `digraph "${title}" {\n`;
    dot += `  layout=${layout};\n`;
    dot += `  rankdir=LR;\n`;
    dot += `  node [shape=${nodeShape}];\n\n`;

    // 添加节点
    for (const [id, node] of knowledgeGraph.nodes.entries()) {
      const label = showLabels ? this.getNodeLabel(node) : '';
      const color = this.getNodeColor(node);

      dot += `  "${id}" [`;
      dot += `label="${label}", `;
      dot += `fillcolor="${color}", `;
      dot += `style="filled,rounded", `;
      dot += `fontsize=10`;
      dot += `];\n`;
    }

    dot += '\n';

    // 添加边
    for (const [id, edge] of knowledgeGraph.edges.entries()) {
      const label = edge.type;
      const weight = edge.weight || 1;

      dot += `  "${edge.from}" -> "${edge.to}" [`;
      dot += `label="${label}", `;
      dot += `penwidth=${weight}, `;
      dot += `fontsize=8`;
      dot += `];\n`;
    }

    dot += '}\n';

    return dot;
  }

  /**
   * 获取节点标签
   */
  getNodeLabel(node) {
    if (node.name) {
      return node.name;
    }

    if (node.data && node.data.content) {
      return node.data.content.substring(0, 30) + '...';
    }

    return `Node ${node.id}`;
  }

  /**
   * 获取节点颜色
   */
  getNodeColor(node) {
    const type = node.type || 'entity';
    return this.nodeTypeColors[type] || this.nodeTypeColors.entity;
  }

  /**
   * 生成 Mermaid 格式
   */
  generateMermaid(knowledgeGraph) {
    let mermaid = 'graph LR\n';

    // 添加节点
    for (const [id, node] of knowledgeGraph.nodes.entries()) {
      const label = this.getNodeLabel(node).replace(/"/g, "'");
      const type = node.type || 'entity';

      mermaid += `  ${id}[${label}\\nType: ${type}]\n`;
    }

    // 添加边
    for (const [id, edge] of knowledgeGraph.edges.entries()) {
      mermaid += `  ${edge.from} -->|${edge.type}| ${edge.to}\n`;
    }

    return mermaid;
  }

  /**
   * 生成文本格式的图谱描述
   */
  generateText(knowledgeGraph) {
    let text = '=== 知识图谱 ===\n\n';

    text += '节点:\n';
    for (const [id, node] of knowledgeGraph.nodes.entries()) {
      text += `  [${id}] `;
      text += `${node.type || 'unknown'}: `;
      text += `${this.getNodeLabel(node)}\n`;
    }

    text += '\n关系:\n';
    for (const [id, edge] of knowledgeGraph.edges.entries()) {
      text += `  [${id}] `;
      text += `${edge.from} --[${edge.type}]--> ${edge.to} `;
      text += `(权重: ${edge.weight})\n`;
    }

    text += '\n统计:\n';
    text += `  节点数: ${knowledgeGraph.nodes.size}\n`;
    text += `  边数: ${knowledgeGraph.edges.size}\n`;

    return text;
  }

  /**
   * 生成 JSON 格式
   */
  generateJSON(knowledgeGraph) {
    const nodes = [];
    const edges = [];

    for (const [id, node] of knowledgeGraph.nodes.entries()) {
      nodes.push({
        id,
        type: node.type,
        name: node.name,
        label: this.getNodeLabel(node),
        data: node.data
      });
    }

    for (const [id, edge] of knowledgeGraph.edges.entries()) {
      edges.push({
        id,
        from: edge.from,
        to: edge.to,
        type: edge.type,
        weight: edge.weight
      });
    }

    return JSON.stringify({
      nodes,
      edges,
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    }, null, 2);
  }

  /**
   * 保存可视化文件
   */
  async saveToFile(content, filename, format = 'dot') {
    const fs = await import('fs/promises');

    const extensions = {
      dot: '.dot',
      mermaid: '.mmd',
      text: '.txt',
      json: '.json'
    };

    const fullPath = filename + (extensions[format] || '.txt');

    try {
      await fs.writeFile(fullPath, content, 'utf-8');
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * 统计分析工具
 */
export class GraphAnalyzer {
  /**
   * 分析图谱统计信息
   */
  analyze(knowledgeGraph) {
    const stats = {
      nodes: knowledgeGraph.nodes.size,
      edges: knowledgeGraph.edges.size,
      nodeTypes: {},
      edgeTypes: {},
      averageDegree: 0,
      density: 0,
      connectedComponents: 0
    };

    // 节点类型统计
    for (const node of knowledgeGraph.nodes.values()) {
      const type = node.type || 'unknown';
      stats.nodeTypes[type] = (stats.nodeTypes[type] || 0) + 1;
    }

    // 边类型统计
    for (const edge of knowledgeGraph.edges.values()) {
      const type = edge.type || 'unknown';
      stats.edgeTypes[type] = (stats.edgeTypes[type] || 0) + 1;
    }

    // 计算平均度
    const degrees = new Map();
    for (const edge of knowledgeGraph.edges.values()) {
      degrees.set(edge.from, (degrees.get(edge.from) || 0) + 1);
      degrees.set(edge.to, (degrees.get(edge.to) || 0) + 1);
    }

    if (degrees.size > 0) {
      const totalDegree = Array.from(degrees.values()).reduce((sum, d) => sum + d, 0);
      stats.averageDegree = totalDegree / degrees.size;
    }

    // 计算密度
    const n = stats.nodes;
    if (n > 1) {
      stats.density = (2 * stats.edges) / (n * (n - 1));
    }

    // 计算连通分量
    stats.connectedComponents = this.countConnectedComponents(knowledgeGraph);

    return stats;
  }

  /**
   * 计算连通分量
   */
  countConnectedComponents(knowledgeGraph) {
    const visited = new Set();
    let components = 0;

    for (const nodeId of knowledgeGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.dfs(nodeId, knowledgeGraph, visited);
        components++;
      }
    }

    return components;
  }

  /**
   * 深度优先搜索
   */
  dfs(nodeId, graph, visited) {
    visited.add(nodeId);

    for (const edge of graph.edges.values()) {
      let nextId = null;
      if (edge.from === nodeId) {
        nextId = edge.to;
      } else if (edge.to === nodeId) {
        nextId = edge.from;
      }

      if (nextId && !visited.has(nextId)) {
        this.dfs(nextId, graph, visited);
      }
    }
  }

  /**
   * 查找最短路径
   */
  findShortestPath(knowledgeGraph, startId, endId) {
    if (!knowledgeGraph.nodes.has(startId) || !knowledgeGraph.nodes.has(endId)) {
      return null;
    }

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === endId) {
        return path;
      }

      // 查找邻居
      const neighbors = this.getNeighbors(current, knowledgeGraph);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null;
  }

  /**
   * 获取邻居节点
   */
  getNeighbors(nodeId, knowledgeGraph) {
    const neighbors = [];

    for (const edge of knowledgeGraph.edges.values()) {
      if (edge.from === nodeId) {
        neighbors.push(edge.to);
      }
      if (edge.to === nodeId) {
        neighbors.push(edge.from);
      }
    }

    return neighbors;
  }
}
