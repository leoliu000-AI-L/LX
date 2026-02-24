/**
 * 实体和关系提取器
 * 用于知识图谱构建
 */

export class EntityExtractor {
  constructor() {
    // 常见实体类型模式
    this.patterns = {
      person: /\b([A-Z][a-z]+)\s+(?:is|was|are|am)\b/g,
      technology: /\b(JavaScript|Python|Java|Go|Rust|TypeScript|AI|ML|Deep Learning|Neural Network)\b/gi,
      organization: /\b(Google|Microsoft|OpenAI|GitHub|Facebook|Amazon|Apple)\b/gi,
      location: /\b(China|USA|UK|Japan|Beijing|Shanghai|New York|San Francisco)\b/gi,
      date: /\b(\d{4}-\d{2}-\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/gi
    };
  }

  /**
   * 提取实体
   */
  extractEntities(text) {
    const entities = {
      persons: [],
      technologies: [],
      organizations: [],
      locations: [],
      dates: []
    };

    // 提取人物
    let matches = text.matchAll(this.patterns.person);
    for (const match of matches) {
      entities.persons.push(match[1]);
    }

    // 提取技术
    matches = text.matchAll(this.patterns.technology);
    for (const match of matches) {
      const tech = match[1];
      if (!entities.technologies.includes(tech)) {
        entities.technologies.push(tech);
      }
    }

    // 提取组织
    matches = text.matchAll(this.patterns.organization);
    for (const match of matches) {
      const org = match[1];
      if (!entities.organizations.includes(org)) {
        entities.organizations.push(org);
      }
    }

    // 提取位置
    matches = text.matchAll(this.patterns.location);
    for (const match of matches) {
      const loc = match[1];
      if (!entities.locations.includes(loc)) {
        entities.locations.push(loc);
      }
    }

    // 提取日期
    matches = text.matchAll(this.patterns.date);
    for (const match of matches) {
      const date = match[1];
      if (!entities.dates.includes(date)) {
        entities.dates.push(date);
      }
    }

    return entities;
  }

  /**
   * 提取关系
   */
  extractRelations(text, entities) {
    const relations = [];

    // 人物-技术关系
    for (const person of entities.persons) {
      for (const tech of entities.technologies) {
        if (text.includes(person) && text.includes(tech)) {
          relations.push({
            from: person,
            to: tech,
            type: 'uses',
            confidence: 0.7
          });
        }
      }
    }

    // 人物-组织关系
    for (const person of entities.persons) {
      for (const org of entities.organizations) {
        if (text.includes(person) && text.includes(org)) {
          relations.push({
            from: person,
            to: org,
            type: 'works_at',
            confidence: 0.6
          });
        }
      }
    }

    return relations;
  }

  /**
   * 提取关键词
   */
  extractKeywords(text, topK = 10) {
    // 简单的 TF-IDF 变体
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/);

    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
      'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'then', 'once',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
      'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
      'now', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'any', 'only', 'that', 'this', 'it', 'these', 'those', '的', '是',
      '了', '在', '有', '和', '与', '或', '但', '而', '因为', '所以'
    ]);

    const wordFreq = {};
    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([word, freq]) => ({ word, freq }));
  }
}
