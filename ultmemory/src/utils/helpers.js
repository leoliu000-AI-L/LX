/**
 * UltMemory Helper Functions
 */

/**
 * 生成唯一 ID
 */
export function generateId() {
  return `ult_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 简单的向量相似度计算 (余弦相似度)
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vector dimensions must match');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 简单的文本向量化 (TF-IDF 简化版)
 */
export function vectorizeText(text) {
  // 分词
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};

  // 计算词频
  for (const word of words) {
    if (word.length > 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  // 生成固定长度的向量 (使用简单的哈希)
  const vectorSize = 128;
  const vector = new Array(vectorSize).fill(0);

  for (const [word, freq] of Object.entries(wordFreq)) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash;
    }

    const index = Math.abs(hash) % vectorSize;
    vector[index] += freq;
  }

  // 归一化
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => (norm > 0 ? val / norm : 0));
}

/**
 * 计算 Phi 值 (IIT - Integrated Information Theory)
 * 简化版本
 */
export function calculatePhi(systemState) {
  // 系统信息熵
  const systemEntropy = calculateEntropy(systemState);

  // 部分信息熵 (简化: 假设各部分独立)
  const partsEntropy = systemState.parts
    ? systemState.parts.reduce((sum, part) => sum + calculateEntropy(part), 0)
    : systemEntropy / 2;

  // Phi = 系统熵 - 部分熵之和
  const phi = Math.max(0, systemEntropy - partsEntropy);

  return Math.min(phi, 1); // 归一化到 [0, 1]
}

/**
 * 计算信息熵
 */
function calculateEntropy(state) {
  if (!state || !state.probabilities) {
    return 0;
  }

  let entropy = 0;
  for (const p of state.probabilities) {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * 压缩上下文 (简化版)
 */
export function compressContext(items) {
  if (!items || items.length === 0) {
    return { summary: '', compressionRatio: 1 };
  }

  // 合并所有内容
  const allContent = items.map(item => item.content).join('\n\n');

  // 提取关键句 (简化: 取每段的第一句)
  const keyPoints = items
    .map(item => {
      const sentences = item.content.split(/[.!?。！？]/);
      return sentences[0] || item.content.substr(0, 100);
    })
    .join('\n- ');

  // 生成摘要
  const summary = `关键要点:\n- ${keyPoints}\n\n总计: ${items.length} 项`;

  const originalSize = allContent.length;
  const compressedSize = summary.length;

  return {
    summary,
    compressionRatio: compressedSize / originalSize,
    originalSize,
    compressedSize
  };
}

/**
 * URI 生成器
 */
export function generateURI(type, path) {
  return `ult://${type}/${path}`;
}

/**
 * 解析 URI
 */
export function parseURI(uri) {
  const match = uri.match(/ult:\/\/([^\/]+)\/(.+)/);
  if (!match) {
    throw new Error(`Invalid URI: ${uri}`);
  }

  return {
    type: match[1],
    path: match[2]
  };
}

/**
 * 深度克隆对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 节流函数
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
