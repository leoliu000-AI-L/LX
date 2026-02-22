# Git仓库设置说明

## ✅ 已完成的步骤

1. ✅ 初始化Git仓库
2. ✅ 添加远程仓库: `https://github.com/leoliu000-AI-L/LX.git`
3. ✅ 创建首次提交 (69个文件, 14511行代码)
4. ✅ 重命名分支为 `main`

## 🔐 需要配置权限

由于当前用户 `leoh081910-ship-it` 没有推送权限到 `leoliu000-AI-L/LX`，你需要：

### 方法1: 使用SSH密钥（推荐）
```bash
# 1. 生成SSH密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 添加到GitHub账户
# 复制 ~/.ssh/id_ed25519.pub 内容到 GitHub > Settings > SSH Keys

# 3. 更改远程URL为SSH
git remote set-url origin git@github.com:leoliu000-AI-L/LX.git

# 4. 推送
git push -u origin main
```

### 方法2: 使用Personal Access Token
```bash
# 1. 在GitHub创建Token: Settings > Developer settings > Personal access tokens

# 2. 使用Token推送
git push -u origin main
# 输入用户名和Token（不是密码）
```

### 方法3: 更改仓库所有者
如果`leoh081910-ship-it`应该是协作者：
1. 访问 https://github.com/leoliu000-AI-L/LX/settings
2. Settings > Collaborators
3. 添加 `leoh081910-ship-it` 作为协作者

## 📊 已提交内容

**首次提交 (commit: 2e85e4c)**
- 69个文件
- 14,511行代码
- 完整的PCEC进化系统

**包含内容**:
- ✅ 15个JavaScript脚本
- ✅ 5个文档文件
- ✅ EvoMap集成
- ✅ Evolver引擎
- ✅ 进化历史记录
- ✅ 68个进化候选
- ✅ 24个PCEC周期记录

## 🔄 后续工作流

### 每次进化后的提交
```bash
# 1. 查看更改
git status

# 2. 添加新文件
git add .

# 3. 创建提交
git commit -m "🧬 PCEC Cycle #N: [描述]

- 新增资产: X个
- 进化候选: Y个
- 性能优化: [描述]
- Bug修复: [描述]"

# 4. 推送到GitHub
git push origin main
```

### 版本标签
```bash
# 为重要版本创建标签
git tag -a v2.0.0 -m "PCEC System v2.0 - Full Evolution"
git push origin v2.0.0
```

### 回退操作
```bash
# 查看提交历史
git log --oneline

# 回退到指定提交
git reset --hard <commit-hash>

# 或者创建反向提交（保留历史）
git revert <commit-hash>
```

## 📁 重要数据文件（已提交）

- `evomap/.published-assets.json` - 发布记录
- `evolver-main/pcec-history.jsonl` - PCEC历史
- `evolver-main/assets/gep/candidates.jsonl` - 进化候选
- `evolver-main/assets/gep/events.jsonl` - 进化事件
- `evolver-main/assets/gep/genes.jsonl` - Gene定义

## 🔍 当前状态

```
分支: main
提交: 2e85e4c
远程: origin (https://github.com/leoliu000-AI-L/LX.git)
状态: 等待推送
```

配置好权限后，运行：
```bash
git push -u origin main
```

即可完成首次推送！
