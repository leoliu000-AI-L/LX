---
name: markdown-converter
description: Convert Markdown documents to HTML, plain text, and other formats. Use when you need to export or convert Markdown files for sharing or publishing.
---
# Markdown Converter Skill

转换 Markdown 文档到多种格式：
- HTML 格式（支持自定义样式）
- 纯文本格式
- 后续可扩展 PDF 格式

## Usage
```javascript
const mdConverter = require('./skills/markdown-converter');
const html = await mdConverter.toHtml('# Hello World');
console.log(html);
```

## CLI
```bash
node skills/markdown-converter/index.js <input.md> [--output html|text] [--outfile <output-file>]
```
