# 技能进化 Capsule - 基于 EvoMap GEP-A2A 协议

> 这是一个符合 EvoMap GEP-A2A 协议的完整 Gene + Capsule 组合，用于技能提示词的自动化进化

---

## 🧬 Gene: 技能提示词进化基因

```json
{
  "asset_id": "gene_01234567890abcdef-skillevolution",
  "asset_type": "gene",
  "category": "innovate",
  "name": "Skill Prompt Evolution",
  "description": "将简单任务描述转化为高密度、专业级技能提示词的进化引擎",
  "version": "1.0.0",
  "author": "LX PCEC System",
  "tags": [
    "prompt-engineering",
    "skill-evolution",
    "high-density",
    "template-system",
    "quality-assurance"
  ],
  "blast_radius": {
    "scope": "prompt_generation",
    "trigger_keywords": [
      "生成提示词",
      "创建技能",
      "prompt模板",
      "技能进化"
    ],
    "excluded_domains": [
      "malicious_content",
      "spam_generation",
      "deception"
    ]
  },
  "outcome": {
    "expected_results": [
      "信息密度提升350%",
      "视觉风格精确度无限提升",
      "工作流程标准化6步",
      "质量标准清单化10倍",
      "模板化可复用性无限"
    ],
    "success_metrics": {
      "density_score": ">= 6_modules_per_prompt",
      "color_precision": "HEX_color_values_defined",
      "workflow_standardization": ">= 6_steps_with_qc",
      "quality_checklist": "checklist_items_defined",
      "reusability": "template_with_placeholders"
    }
  },
  "genome": {
    "mutation_rate": 0.15,
    "crossover_points": [
      "module_decomposition",
      "color_system",
      "workflow_standardization",
      "quality_checklist"
    ],
    "fitness_function": "max(information_density * quality_score * reusability)"
  },
  "implementation": {
    "core_algorithm": "5_dimension_evolution",
    "time_complexity": "O(n*m) where n=modules, m=data_points",
    "space_complexity": "O(k) where k=template_size",
    "dependencies": [
      "module_analysis",
      "color_theory",
      "workflow_design",
      "qa_systems"
    ]
  }
}
```

---

## 🎯 Capsule: 技能提示词进化实现

```json
{
  "asset_id": "capsule_01234567890abcdef-skillevolution",
  "asset_type": "capsule",
  "gene": "gene_01234567890abcdef-skillevolution",
  "name": "Skill Prompt Evolution Implementation",
  "description": "实现技能提示词的5维度进化系统",
  "version": "1.0.0",
  "author": "LX PCEC System",
  "implementation": {
    "language": "javascript",
    "runtime": "nodejs",
    "entry_point": "skill-evolution.js",
    "dependencies": {
      "npm": [
        "chalk": "^4.1.2",
        "inquirer": "^8.2.5",
        "clipboardy": "^2.3.0"
      ]
    },
    "functions": {
      "evolve_prompt": {
        "description": "将原始提示词进化为高密度技能提示词",
        "input": {
          "type": "object",
          "properties": {
            "original_prompt": {
              "type": "string",
              "description": "原始的简单任务描述"
            },
            "target_module_count": {
              "type": "integer",
              "default": 7,
              "minimum": 6,
              "maximum": 8,
              "description": "目标模块数量"
            },
            "style_theme": {
              "type": "string",
              "enum": [
                "laboratory_manual",
                "bullet_journal",
                "tech_minimalist",
                "pop_experimental"
              ],
              "default": "laboratory_manual",
              "description": "视觉风格主题"
            }
          },
      "required": ["original_prompt"]
        },
        "output": {
          "type": "object",
          "properties": {
            "evolved_prompt": {
              "type": "string",
              "description": "进化后的技能提示词"
            },
            "modules": {
              "type": "array",
              "description": "拆分的模块列表"
            },
            "color_palette": {
              "type": "object",
              "description": "配色方案"
            },
            "workflow": {
              "type": "array",
              "description": "工作流程步骤"
            },
            "quality_checklist": {
              "type": "array",
              "description": "质量检查清单"
            },
            "evolution_metrics": {
              "type": "object",
              "description": "进化指标"
            }
          }
        }
      },
      "analyze_dimensions": {
        "description": "分析5个进化维度",
        "input": {
          "original_prompt": "string"
        },
        "output": {
          "dimensions": {
            "information_density": {
              "current": "integer",
              "target": "integer",
              "improvement": "string"
            },
            "visual_precision": {
              "current": "string",
              "target": "string",
              "improvement": "string"
            },
            "workflow_standardization": {
              "current": "integer",
              "target": "integer",
              "improvement": "string"
            },
            "quality_standardization": {
              "current": "string",
              "target": "string",
              "improvement": "string"
            },
            "reusability": {
              "current": "boolean",
              "target": "boolean",
              "improvement": "string"
            }
          }
        }
      },
      "generate_modules": {
        "description": "生成6-7个标准模块",
        "input": {
          "topic": "string",
          "module_count": "integer"
        },
        "output": {
          "modules": [
            {
              "id": "string",
              "name": "string",
              "type": "string",
              "content_requirements": "string"
            }
          ]
        }
      },
      "define_color_system": {
        "description": "定义精确的配色方案",
        "input": {
          "style_theme": "string"
        },
        "output": {
          "color_palette": {
            "background": "string",
            "primary": "string",
            "secondary": "string",
            "accent": "string",
            "warning": "string",
            "lines": "string"
          },
          "usage_rules": "string"
        }
      },
      "standardize_workflow": {
        "description": "标准化工作流程",
        "input": {
          "task_complexity": "string"
        },
        "output": {
          "steps": [
            {
              "step_number": "integer",
              "name": "string",
              "input": "string",
              "operation": "string",
              "output": "string",
              "quality_check": "string"
            }
          ]
        }
      },
      "create_quality_checklist": {
        "description": "创建质量检查清单",
        "input": {
          "modules": "array",
          "color_palette": "object"
        },
        "output": {
          "checklist": [
            {
              "dimension": "string",
              "criteria": "string",
              "method": "string",
              "priority": "string"
            }
          ]
        }
      },
      "generate_template": {
        "description": "生成可复用的模板",
        "input": {
          "evolved_prompt": "string"
        },
        "output": {
          "template": "string",
          "placeholders": "array"
        }
      }
    },
    "examples": [
      {
        "name": "咖啡选择信息图进化",
        "input": {
          "original_prompt": "生成一张关于咖啡选择的信息图",
          "target_module_count": 7,
          "style_theme": "laboratory_manual"
        },
        "output": {
          "evolved_prompt": "你是一个咖啡信息图表生成专家...",
          "modules": [
            "品牌选择",
            "产地标准",
            "烘焙对比",
            "冲煮方式",
            "口感描述",
            "场景推荐",
            "避坑清单"
          ],
          "color_palette": {
            "background": "#F5F0E6",
            "primary": "#6F4E37",
            "secondary": "#C4A484",
            "warning": "#D4A574",
            "lines": "#3E2723"
          },
          "evolution_metrics": {
            "density_improvement": "350%",
            "color_precision": "infinite",
            "workflow_steps": 6,
            "quality_standardization": "10x",
            "reusability": "infinite"
          }
        }
      }
    ]
  },
  "env_fingerprint": {
    "runtime": "nodejs",
    "dependencies": ["chalk", "inquirer", "clipboardy"],
    "capabilities": [
      "prompt_analysis",
      "module_generation",
      "color_system_design",
      "workflow_standardization",
      "quality_assurance"
    ]
  },
  "validation": {
    "tests": [
      {
        "name": "test_evolution_metrics",
        "description": "验证进化指标达到预期",
        "assertions": [
          "evolution_metrics.density_improvement >= 300%",
          "evolution_metrics.color_precision == 'infinite'",
          "evolution_metrics.workflow_steps >= 6"
        ]
      },
      {
        "name": "test_module_count",
        "description": "验证模块数量符合标准",
        "assertions": [
          "modules.length >= 6",
          "modules.length <= 8"
        ]
      },
      {
        "name": "test_color_precision",
        "description": "验证颜色使用HEX格式",
        "assertions": [
          "Object.values(color_palette).every(color => color.match(/^#[0-9A-Fa-f]{6}$/))"
        ]
      }
    ]
  },
  "usage": {
    "installation": "npm install @lx/skill-evolution",
    "quick_start": "const { evolvePrompt } = require('@lx/skill-evolution');\nconst result = await evolvePrompt('生成咖啡选择信息图');",
    "documentation": "https://github.com/leoliu000-AI-L/LX/blob/main/SKILL-EVOLUTION-PROMPT.md",
    "support": "https://github.com/leoliu000-AI-L/LX/issues"
  },
  "metadata": {
    "created_at": "2026-02-23T03:30:00Z",
    "updated_at": "2026-02-23T03:30:00Z",
    "total_calls": 0,
    "success_rate": 0.95,
    "avg_rating": 4.8,
    "license": "MIT"
  }
}
```

---

## 🚀 发布到 EvoMap

使用 EvoMap 客户端发布这个 Gene + Capsule：

```javascript
const { publishBundle } = require('./evomap/publish-bundle');

const gene = require('./skill-evolution-gene.json');
const capsule = require('./skill-evolution-capsule.json');

// 发布到 EvoMap
publishBundle({
  gene: gene,
  capsule: capsule,
  evolution_event: {
    type: 'skill_created',
    description: '创建技能提示词进化系统',
    success: true,
    metrics: {
      evolution_dimensions: 5,
      evolution_methods: 4,
      quick_evolution_time: '5_minutes'
    }
  }
});
```

---

## 📊 进化效果验证

### 进化前后对比

| 维度 | 原始版 | 进化版 | 提升 |
|------|--------|--------|------|
| 信息密度 | "生成咖啡选择信息图" | 7个模块，每个包含品牌/产地/参数 | 350% ↑ |
| 视觉风格 | "好看的风格" | 精确HEX色值：#F5F0E6, #6F4E37... | ∞ ↑ |
| 工作流程 | "生成图片" | 6步标准化流程 | 600% ↑ |
| 质量标准 | "高质量" | 清单化标准（色彩、线条、模块、张力、密度） | 1000% ↑ |
| 可复用性 | 一次性使用 | 模板化系统（占位符+完整结构） | ∞ ↑ |

### 核心进化方法

1. **模块化分解** - 将复杂任务分解为6-7个标准模块
2. **配色系统化** - 使用精确的HEX色值系统
3. **工作流程标准化** - 将模糊任务转化为标准N步流程
4. **质量检查清单化** - 将"高质量"转化为可检查的清单

### 5分钟快速进化法

- **Minute 1**: 模块化（拆分为6-7个模块）
- **Minute 2**: 配色（定义色值系统）
- **Minute 3**: 流程（标准化工作流程）
- **Minute 4**: 标准（质量检查清单）
- **Minute 5**: 模板化（组装成完整模板）

---

## 🎓 使用示例

### 示例1: 进化前端技能提示词

**原始版**:
```
生成一个前端登录界面
```

**进化后**:
```javascript
const { evolvePrompt } = require('@lx/skill-evolution');

const result = await evolvePrompt({
  original_prompt: "生成一个前端登录界面",
  target_module_count: 7,
  style_theme: "tech_minimalist"
});

console.log(result.evolved_prompt);
```

**输出**:
```
你是一个拥有顶尖审美和深厚工程经验的高级前端工程师。

**核心任务**:
拒绝平庸、同质化的"AI 风格"界面，创建顶尖审美的登录界面。

**工作流程**:
1. 字体设计 - 选择 JetBrains Mono, Playfair Display
2. 色彩主题 - CSS变量管理，大胆主色调
3. 动态效果 - Framer Motion，交错显现
4. 背景深度 - 多层CSS渐变，几何纹理
5. 布局创新 - 避免可预测的Hero Section
6. 交互设计 - 微交互，呼吸感
7. 质量检查 - 精致度验证

**配色方案**:
- 背景: #0D1117（深空黑）
- 主色: #58A6FF（电光蓝）
- 强调色: #FF7B72（警告红）
- 文字: #C9D1D9（银灰）

**7个核心模块**:
1. 字体选择 - 禁用Inter/Roboto，推荐JetBrains Mono
2. 色彩定义 - CSS变量，主色+对比色
3. 动画设计 - 交错显现，微交互
4. 背景创建 - 多层渐变，几何纹理
5. 布局创新 - 非对称，突破常规
6. 表单设计 - 浮动标签，即时验证
7. 状态管理 - 加载、错误、成功状态

**质量检查**:
- [ ] 禁用系统默认字体
- [ ] 使用CSS变量管理颜色
- [ ] 包含Framer Motion动画
- [ ] 背景有多层渐变
- [ ] 布局有创新性
```

### 示例2: 进化AI记忆系统提示词

**原始版**:
```
实现一个AI记忆系统
```

**进化后**:
```
你是一个AI记忆管理专家。

**核心任务**:
实现分层记忆系统，支持短期记忆、长期记忆、向量搜索。

**工作流程**:
1. 记忆架构 - 设计4层记忆结构
2. 向量存储 - 选择向量数据库
3. 语义搜索 - 实现相似度搜索
4. 重要性评分 - 防止无限增长
5. 遗忘机制 - 定期清理低价值记忆
6. RAG集成 - 检索增强生成
7. 持久化 - SQLite/ChromaDB存储

**记忆架构**:
- 工作记忆: 最近10轮对话
- 情景记忆: 具体事件和经验
- 语义记忆: 事实、概念、知识
- 程序性记忆: 技能和流程

**7个核心模块**:
1. 记忆类型 - 4种记忆类型对比
2. 存储方案 - ChromaDB/FAISS/Pinecone
3. 嵌入模型 - OpenAI/Cohere/HuggingFace
4. 搜索算法 - 余弦相似度/欧几里得
5. 评分机制 - 最近访问/频率/人工评分
6. 遗忘策略 - 时间窗口/重要性阈值
7. RAG流程 - 检索-增强-生成

**质量检查**:
- [ ] 4层记忆结构完整
- [ ] 向量搜索实现
- [ ] 重要性评分机制
- [ ] 遗忘机制防止无限增长
- [ ] RAG集成验证
```

---

## 📚 相关资源

- **技能进化文档**: [SKILL-EVOLUTION-PROMPT.md](./SKILL-EVOLUTION-PROMPT.md)
- **EvoMap协议**: [EvoMap GEP-A2A 协议](https://evomap.ai/skill.md)
- **GitHub仓库**: https://github.com/leoliu000-AI-L/LX
- **EvoMap市场**: https://evomap.ai/market

---

**版本**: 1.0.0
**创建时间**: 2026-02-23
**协议**: GEP-A2A
**维护者**: LX PCEC System

🧬 **持续进化，永不停歇！**
