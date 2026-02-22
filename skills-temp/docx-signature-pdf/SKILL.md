---
name: docx-signature-pdf
description: |
  自动处理 Word 文档：旋转签名图片、插入到指定位置、导出 PDF。
  适用于合同、公函等需要电子签名的场景。
---

# Docx 签名 + PDF 导出 Skill

自动将签名图片旋转并插入到 Word 文档的签名位置，然后导出为 PDF。

## 功能

1. **签名图片旋转** - 将竖屏签名旋转90度变为横屏
2. **智能定位** - 自动查找文档中的"签字"、"签名"等标记位置
3. **插入签名** - 在找到的位置插入调整大小的签名图片
4. **PDF 导出** - 转换为 PDF 格式（需要系统安装 LibreOffice）

## 使用方法

### 作为 Skill 调用

```bash
# 基本用法
node ~/.openclaw/workspace/skills/docx-signature-pdf/scripts/process.js \
  --docx "path/to/document.docx" \
  --signature "path/to/signature.png" \
  --output "path/to/output/"

# 完整参数
node scripts/process.js \
  --docx "input.docx" \
  --signature "signature.png" \
  --output "./output/" \
  --width 150 \
  --height 75 \
  --angle 90
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--docx` | 输入的 Word 文档路径 | 必填 |
| `--signature` | 签名图片路径 (PNG/JPG) | 必填 |
| `--output` | 输出目录 | `./output/` |
| `--width` | 签名显示宽度 (像素) | 150 |
| `--height` | 签名显示高度 (像素) | 75 |
| `--angle` | 旋转角度 | 90 |
| `--no-pdf` | 跳过 PDF 导出 | false |

## 依赖安装

```bash
cd ~/.openclaw/workspace/skills/docx-signature-pdf
npm install
```

### 系统依赖 (PDF 导出)

**Ubuntu/Debian:**
```bash
sudo apt-get install libreoffice
```

**macOS:**
```bash
brew install --cask libreoffice
```

**Windows:**
下载安装 LibreOffice 并确保 soffice 在 PATH 中

## 输出文件

- `{filename}_signed.docx` - 带签名的 Word 文档
- `{filename}.pdf` - 导出的 PDF 文件（如果安装了 LibreOffice）
- `signature_rotated.png` - 旋转后的签名图片

## 签名位置识别

自动识别以下标记：
- `签字：`
- `签名：`
- `签章：`
- `法定代表人（签字）：`

如果未找到标记，签名将插入到文档末尾。

## 技术实现

1. 使用 `sharp` 处理图片旋转和缩放
2. 使用 `adm-zip` 操作 docx 文件结构
3. 直接操作 Word XML (document.xml) 插入图片
4. 使用 LibreOffice 命令行导出 PDF

## 注意事项

- 签名图片建议为透明背景的 PNG
- 复杂的 docx 格式可能需要手动调整
- PDF 导出需要系统安装 LibreOffice
