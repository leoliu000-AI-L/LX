# Skill: 高密度信息图生成
# 用于调用 nanobanana API 生成实验室精密手册感 + 波普实验风格的信息图

## 触发条件
用户需要"高信息密度大图"、"信息图"、"可视化"、"密度图"等

## 工作流

### 步骤 1：启动询问
确认主题：
- 核心主题是什么？
- 目标受众？
- 关键信息点有哪些？

### 步骤 2：深度搜索
使用 Tavily/智谱搜索相关信息，收集：
- 品牌/产品名称
- 具体数值、百分比
- 对比数据
- 技术参数

### 步骤 3：提炼价值
从搜索结果中提取 6-7 个核心模块，每个模块包含：
- 4字名称
- 具体数据（品牌名、数值、百分比）
- 视觉符号建议

### 步骤 4：建立视觉坐标体系

```
图片1 → 核心主题：[主题名称]
├─ 坐标 A-01：[4字名称]（品牌阵列/对比区）
├─ 坐标 B-05：[4字名称]（核心参数/刻度区）
├─ 坐标 C-12：[4字名称]（结构拆解/细节图）
├─ 坐标 D-03：[4字名称]（场景网格/对比卡）
├─ 坐标 E-08：[4字名称]（警告区/ pitfalls）
├─ 坐标 F-15：[4字名称]（快速检查/数据表）
└─ 坐标 G-07：[4字名称]（状态栏/信息堆叠）
```

### 步骤 5：生成高密度内容
每个坐标模块填充：
- 标题（4字）
- 具体品牌名/产品名
- 数值 + 单位（如：180°C、45度、99.9%）
- 视觉符号（X轴、切角、刻度等）

### 步骤 6：用户确认
展示坐标体系和内容，等待用户确认。

### 步骤 7：调用 nanobanana API 生图

**Prompt 模板（严格使用）：**

```
Create a high-density, professional information design infographic for Xiaohongshu about「[主题名称]」.

=== CRITICAL STYLE REQUIREMENTS (SYSTEMIC & EXPERIMENTAL) ===

【COLOR PALETTE - BLUEPRINT & POP LOGIC】
- BACKGROUND: Professional grayish-white or faint blueprint grid texture (#F2F2F2).
- SYSTEMIC BASE: Muted Teal/Sage Green (#B8D8BE) for major functional blocks and stable data zones.
- HIGH-ALERT ACCENT: Vibrant Fluorescent Pink (#E91E63) strictly for "Pitfalls", "Critical Warnings", or the single most important "Winner" data point.
- MARKER HIGHLIGHTS: Vivid Lemon Yellow (#FFF200) used as a translucent highlighter effect for keywords.
- LINE ART: Ultra-fine Charcoal Brown (#2D2926) for technical grids, coordinates, and hair-lines.

【LAYOUT & INFORMATION DENSITY】
- INFORMATION AS COORDINATES: Every module must have a coordinate-style label (e.g., R-20, G-02, SEC-08).
- THE "LAB MANUAL" AESTHETIC: Use a mix of microscopic details (technical drawings) and macroscopic data (large bold headers).
- HIGH DENSITY: Pack 6-7 distinct modules per image. Minimize margins; every corner should contain metadata like tiny bar codes, time stamps, or technical parameters.
- VISUAL CONTRAST: Use massive bold typography for primary headers, contrasted with tiny, ultra-crisp technical annotations (8pt look).

【ILLUSTRATION & GRAPHIC ELEMENTS】
1. TECHNICAL DIAGRAMS: Instead of cute icons, use exploded views, cross-sections with anchor points, and architectural skeletal lines.
2. COORDINATE SYSTEMS: Use vertical/horizontal rulers with precise markers (e.g., 0.5mm, 1.8mm, 45°) to show quality levels.
3. DATA BLOCKS: Use "Marker-over-Print" look—color blocks should be slightly offset from the text they highlight, creating a postmodern print feel.
4. SYMBOLS: Include cross-hair targets, mathematical symbols (Σ, Δ, ∞), and directional arrows (X/Y axis).

【SPECIFIC MODULE STRUCTURE - MUST HAVE 6-7】
[根据步骤4的坐标体系填充具体内容]

【TYPOGRAPHY】
- Headers: Bold Brutalist Chinese characters, high impact.
- Body: Professional sans-serif or crisp handwritten technical print.
- Numbers: Large, highlighted with Yellow or Blue to stand out.

【AVOID】
- ❌ NO cute/cartoonish doodles.
- ❌ NO soft pastels or generic textures.
- ❌ NO empty white space.
- ❌ NO flat vector stock icons.

Aspect Ratio: 3:4 (Portrait)
```

## API 配置

**API Key:** `sk-53XEFIMv8k5PLFLMJVkA9Kzo7GZrIKhGluzM9peqDWPMCUHf`
**Endpoint:** `https://api.302.ai/google/v1/models/gemini-3-pro-image-preview`
**Model:** `gemini-3-pro-image-preview`
**Aspect Ratio:** `3:4` (默认)

## API 调用

```javascript
// 调用 302.ai Nano-Banana-Pro API
const response = await fetch('https://api.302.ai/google/v1/models/gemini-3-pro-image-preview', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-53XEFIMv8k5PLFLMJVkA9Kzo7GZrIKhGluzM9peqDWPMCUHf'
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  })
});

// 解析响应
const data = await response.json();
const imageUrl = data.candidates[0].content.parts[0].url;
```

**注意：** API Key 已配置，请勿泄露给任何人。

## 质量检查清单

生成前确认：
- [ ] 色彩过滤：是否只用了系统性的粉、绿、黄、黑？（严禁五颜六色）
- [ ] 线条密度：是否有足够精细的网格线和坐标标注？
- [ ] 模块数量：确保包含 6-7 个独立的信息块
- [ ] 张力检查：标题是否有足够大的视觉冲击力，与细小的参数形成对比？

## 示例

用户："帮我生成一张关于机械键盘的高密度信息图"

执行：
1. 搜索机械键盘品牌、轴体参数、价格区间
2. 提炼7个模块：
   - A-01：品牌阵列（Cherry、Keychron、HHKB...）
   - B-05：轴体刻度（红轴45g、青轴50g...）
   - C-12：结构拆解（爆炸图展示内部）
   - D-03：场景对比（办公/游戏/编程）
   - E-08：避坑指南（Pink高亮）
   - F-15：参数速查（价格/连接方式）
   - G-07：选购状态（决策流程图）
3. 用户确认
4. 调用 API 生图
