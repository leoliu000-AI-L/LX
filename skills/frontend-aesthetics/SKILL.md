# Skill: 前端设计美学
# 避免 AI slop，生成有品质感的界面

## 触发条件
用户要求生成 landing page、React 组件、前端界面等

## 核心指令

```
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight.

Focus on:

1. TYPOGRAPHY
   - Avoid: Inter, Roboto, Open Sans, Lato, default system fonts
   - Use: 
     * Code aesthetic: JetBrains Mono, Fira Code, Space Grotesk
     * Editorial: Playfair Display, Crimson Pro
     * Technical: IBM Plex family, Source Sans 3
     * Distinctive: Bricolage Grotesque, Newsreader
   - Pairing: High contrast = interesting (Display + monospace, serif + geometric sans)
   - Use extremes: 100/200 weight vs 800/900, size jumps of 3x+
   - Load from Google Fonts

2. COLOR & THEME
   - Commit to a cohesive aesthetic
   - Use CSS variables for consistency
   - Dominant colors with sharp accents > timid, evenly-distributed palettes
   - Draw from IDE themes and cultural aesthetics

3. MOTION
   - Use animations for effects and micro-interactions
   - Prioritize CSS-only solutions for HTML
   - Use Motion library for React when available
   - Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay)

4. BACKGROUNDS
   - Avoid: solid white, flat colors
   - Use: atmospheric effects, textures, depth, gradients with purpose

5. THEMES (可选)
   - RPG: Fantasy palettes, ornate borders, parchment textures, medieval serif
   - Cyberpunk: Neon accents, dark mode, glitch effects, monospace
   - Editorial: Clean grids, generous whitespace, classic serif + sans pairing
   - Brutalist: Bold typography, high contrast, raw elements, asymmetric layouts
</frontend_aesthetics>
```

## 使用方式

当用户要求生成前端界面时，自动加载此 skill 并应用上述指令。

## 示例

**Before (AI slop):**
- Inter 字体
- 紫色渐变
- 白底
- 静态

**After (with skill):**
- JetBrains Mono + Playfair Display
- 深色主题 + 荧光粉强调
- 大气背景 + 纹理
- 入场动画 + 微交互

## 来源
Claude Blog: Improving Frontend Design Through Skills
https://claude.com/blog/improving-frontend-design-through-skills
