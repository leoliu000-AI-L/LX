---
name: agent-browser
description: "Browser automation using agent-browser CLI (Playwright-based). Use for: screenshots, form filling, web scraping, page navigation, data extraction. NOT for: video playback, complex JavaScript-heavy interactions without snapshots."
homepage: https://skills.sh/vercel-labs/agent-browser/agent-browser
---

# Agent Browser Skill

基于 Playwright 的浏览器自动化 CLI 工具，用于网页截图、表单填写、数据抓取等任务。

## 安装

```bash
npm install -g agent-browser
npx playwright install chromium
sudo apt-get install -y fonts-noto-cjk  # 中文字体支持
```

## 核心命令

### 导航
```bash
agent-browser open <url>          # 打开网页
agent-browser close               # 关闭浏览器
```

### 截图
```bash
agent-browser screenshot                    # 当前视口截图
agent-browser screenshot --full             # 整页截图
agent-browser screenshot --annotate         # 带元素标注的截图
```

### 页面快照（获取元素引用）
```bash
agent-browser snapshot -i          # 获取可交互元素列表（@e1, @e2...）
```

### 交互操作
```bash
agent-browser click @e1            # 点击元素
agent-browser fill @e2 "文本"       # 填写输入框
agent-browser type @e2 "文本"       # 输入（不清空原有内容）
agent-browser select @e3 "选项"     # 选择下拉框
agent-browser press Enter          # 按键
```

### 等待
```bash
agent-browser wait --load networkidle      # 等待网络空闲
agent-browser wait @e1                     # 等待元素出现
agent-browser wait 3000                    # 等待毫秒
```

## 常用模式

### 截图流程
```bash
agent-browser open https://example.com && \
agent-browser wait --load networkidle && \
agent-browser screenshot --full /tmp/output.png
```

### 表单填写
```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
agent-browser fill @e1 "用户名"
agent-browser fill @e2 "密码"
agent-browser click @e3
```

### 会话保持
```bash
agent-browser --session mytask open https://example.com
# ... 操作 ...
agent-browser --session mytask close
```

## 注意事项

1. **中文字体**：确保已安装 `fonts-noto-cjk`，否则中文显示为方块
2. **元素引用**：`@e1`, `@e2` 等引用在页面变化后会失效，需重新 `snapshot`
3. **超时**：慢页面用 `wait --load networkidle` 而非固定等待
4. **会话隔离**：多任务时使用 `--session <name>` 避免冲突

## 依赖

- Node.js
- Playwright (Chromium)
- 中文字体 (fonts-noto-cjk)
