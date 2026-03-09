---
name: daily-news-briefing
description: 每日新闻简报生成器 - 自动搜索整理AI/科技、财经、热点新闻，生成结构化简报
version: 1.0.0
author: group-test
---

# Daily News Briefing - 每日新闻简报生成器

自动搜索整理多领域新闻，生成结构化简报，支持定时发送。

## 实现原理

**不是抓取固定文章，而是实时搜索整理**

```
用户请求
    ↓
调用搜索接口（kimi_search）
    ↓
多维度搜索（AI/科技、财经、热点）
    ↓
提取关键信息（标题、摘要、来源、时间）
    ↓
结构化整理（分类、排序、去重）
    ↓
生成简报（Markdown格式）
    ↓
发送给用户/群组
```

## 核心特点

1. **实时搜索** - 使用kimi_search接口，获取最新资讯
2. **多维度覆盖** - AI科技、财经经济、热点资讯
3. **智能整理** - 自动提取关键信息，去重排序
4. **结构化输出** - 分类清晰，便于阅读
5. **可定时执行** - 支持cron定时任务

## 使用方法

### 命令行

```bash
# 生成今日新闻简报
python3 news_briefing.py --type news

# 生成财经日报
python3 news_briefing.py --type finance

# 生成AI资讯
python3 news_briefing.py --type ai

# 发送到飞书群
python3 news_briefing.py --type news --target oc_xxx
```

### Python API

```python
from daily_news_briefing import NewsBriefingGenerator

generator = NewsBriefingGenerator()

# 生成新闻简报
briefing = generator.generate(
    categories=['ai', 'finance', 'hot'],
    max_items=15
)

print(briefing)
```

## 配置

```ini
# config/news_briefing.conf
[search]
categories = ai,finance,hot
max_items_per_category = 5
time_range = today

[output]
format = markdown
include_source = true
include_time = true

[schedule]
enabled = true
cron = 0 9 * * *  # 每天9点执行
```

## 工作流程

```python
def generate_briefing():
    # 1. 定义搜索维度
    categories = {
        'ai': 'AI/科技领域重要新闻',
        'finance': '财经经济要闻',
        'hot': '国内国际热点'
    }
    
    # 2. 并行搜索
    results = {}
    for cat, query in categories.items():
        results[cat] = kimi_search(f"{query} 今天")
    
    # 3. 提取关键信息
    news_items = []
    for cat, result in results.items():
        for item in result[:5]:  # 每个类别取前5条
            news_items.append({
                'category': cat,
                'title': item['title'],
                'summary': extract_summary(item['content']),
                'source': item['source'],
                'time': item['date']
            })
    
    # 4. 生成简报
    briefing = format_briefing(news_items)
    
    return briefing
```

## 输出示例

```markdown
## 今日新闻简报（2026-02-27）

### 🤖 AI/科技
1. **中国AI视频模型Seedance 2.0全球走红**
   - 摘要：中国人工智能视频创作模型发布后在全球网络上迅速走红...
   - 来源：中国经济网
   - 时间：2026-02-27

### 💰 财经经济
1. **英伟达财报超预期却遭股价跳水**
   - 摘要：第四财季盈利超预期，但股价下跌超5%，市值蒸发超1.6万亿元...
   - 来源：新浪财经
   - 时间：2026-02-27

### 🌍 热点资讯
1. **美伊第三轮间接谈判取得重大进展**
   - 摘要：双方表示取得良好进展，在某些领域已接近达成共识...
   - 来源：中国新闻网
   - 时间：2026-02-27
```

## 定时任务设置

```bash
# 每天早上9点自动生成并发送
cron.add(
    name="每日新闻简报",
    schedule="0 9 * * *",
    task="python3 news_briefing.py --type all --target oc_xxx"
)
```

## 依赖

- Python 3.x
- kimi_search（联网搜索）
- feishu-news-card（发送卡片）

## 文件结构

```
skills/daily-news-briefing/
├── SKILL.md              # 技能文档
├── news_briefing.py      # 主程序
├── config/
│   └── news_briefing.conf
└── examples/
    ├── morning_briefing.py
    └── finance_daily.py
```

## 最佳实践

1. **搜索维度** - 根据需求调整搜索类别
2. **数量控制** - 每个类别3-5条，避免信息过载
3. **定时发送** - 选择用户活跃时间段
4. **来源标注** - 保留新闻来源，便于追溯

## 更新日志

### v1.0.0 (2026-02-27)
- 初始版本
- 支持多维度新闻搜索
- 自动生成结构化简报
- 支持定时发送

---

**一句话总结**：实时搜索，智能整理，定时播报。
