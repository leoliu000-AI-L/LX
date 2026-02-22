# 出行风水测算小程序 - 封面使用说明

## 📁 文件说明

### 图片文件
- `image1.png` (759KB) - 生肖图片，包含12个生肖图标
- `image2.png` (703KB) - 顶部装饰图片

### 布局说明
封面使用CSS布局将两张图片垂直拼接显示：

1. **顶部区域（35%）** - 显示 image2.png 装饰图
2. **生肖区域（55%）** - 显示 image1.png 生肖图
3. **提示文字** - 顶部显示"✨ 请选择您的生肖 ✨"
4. **透明按钮层** - 覆盖在生肖图上，4×3网格布局，对应12个生肖位置

## 🎨 设计特点

### 封面尺寸
- 与测算页面保持一致：430px 宽度
- 全屏显示：100% 高度

### 交互效果
- **悬停效果**：金色光晕 + 放大动画
- **点击反馈**：300ms 延迟后进入测算页面
- **透明按钮**：完全透明，不影响原图片显示

### 12生肖按钮布局（4×3网格）
```
[鼠] [牛] [虎] [兔]
[龙] [蛇] [马] [羊]
[猴] [鸡] [狗] [猪]
```

## 🔧 技术实现

### CSS布局
```css
/* 垂直拼接两张图片 */
.cover-top-image {
    height: 35%;
    background-image: url('./image2.png');
    background-size: contain;
}

.cover-zodiac-image {
    height: 55%;
    background-image: url('./image1.png');
    background-size: contain;
}

/* 透明按钮覆盖层 */
.zodiac-buttons-overlay {
    position: absolute;
    top: 35%;
    height: 55%;
}

.zodiac-btn-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, 1fr);
}
```

## 📱 使用流程

1. 打开页面 → 看到拼接后的封面
2. 顶部提示 → "✨ 请选择您的生肖 ✨"
3. 浏览生肖 → 12个生肖图标整齐排列
4. 点击生肖 → 对应位置的透明按钮响应
5. 自动跳转 → 进入测算页面，主题已个性化

## ✨ 视觉效果

- **渐变背景**：深红色渐变（#8B0000 → #DC143C → #FF3B30）
- **金色提示**：脉冲动画提示用户选择
- **光晕效果**：悬停时金色光晕扩散
- **平滑过渡**：500ms页面切换动画

## 🎯 自定义调整

如需调整布局，可修改以下参数：

```css
/* 调整图片比例 */
.cover-top-image { height: 35%; }  /* 改为30%或40% */
.cover-zodiac-image { height: 55%; }  /* 相应调整 */

/* 调整按钮间距 */
.zodiac-btn-grid { gap: 8px; }  /* 改为10px或12px */

/* 调整提示文字位置 */
.cover-hint { top: 3%; }  /* 改为2%或5% */
```
