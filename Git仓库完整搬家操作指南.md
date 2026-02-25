# Git仓库完整搬家操作指南

**当前仓库信息:**
- 仓库名称: LX
- 当前远程: https://github.com/leoliu000-AI-L/LX.git
- 主分支: main
- 仓库大小: 12MB (.git目录)
- 提交历史: 最近的提交包括TikTok分析报告和UltMemory系统

**搬家日期:** 2026年2月25日
**适用场景:** 迁移到新的GitHub账号、转移到GitLab/Gitee等平台

---

## 🎯 搬家前准备

### 第一步: 信息收集清单

在开始搬家前,请确认以下信息:

- [ ] **新仓库地址** (目标仓库的完整URL)
- [ ] **新平台类型** (GitHub/GitLab/Gitee/Bitbucket等)
- [ ] **是否保留原仓库** (保留作为备份或完全删除)
- [ ] **是否需要迁移所有分支** (当前只有main分支)
- [ ] **是否需要迁移Tags** (查看现有tags)
- [ ] **是否需要迁移Issues** (GitHub的issue和PR)
- [ ] **是否需要迁移Wiki** (如果有Wiki页面)

### 第二步: 检查当前仓库状态

在仓库目录执行以下命令:

```bash
# 1. 查看当前远程仓库
git remote -v

# 2. 查看所有分支
git branch -a

# 3. 查看提交历史
git log --oneline -10

# 4. 查看仓库大小
du -sh .git

# 5. 查看未提交的更改
git status

# 6. 查看所有tags
git tag

# 7. 查看所有远程分支
git branch -r

# 8. 查看最近一次提交
git log -1
```

### 第三步: 备份当前仓库

**非常重要!** 在搬家前务必备份:

```bash
# 方法1: 完整克隆备份
cd ..
git clone https://github.com/leoliu000-AI-L/LX.git LX-backup
cd LX-backup
git log --oneline > commit-history.txt
git branch -a > branches.txt
git tag > tags.txt

# 方法2: 创建压缩包
cd ..
tar -czf LX-backup-$(date +%Y%m%d).tar.gz LX

# 方法3: 推送到备用远程仓库(可选)
# 如果有其他Git账号或平台作为备份
git remote add backup https://your-backup-repo-url.git
git push backup --all
```

---

## 📋 搬家方案选择

### 方案一: 完整迁移(推荐)
**适用场景:**
- 永久迁移到新仓库
- 保留完整的提交历史
- 需要继续开发

**优点:** 完整保留历史,无缝切换
**缺点:** 需要更新所有本地引用

### 方案二: 镜像迁移
**适用场景:**
- 迁移到GitLab等其他平台
- 需要同时维护多个远程仓库

**优点:** 原仓库保持不变
**缺点:** 需要同时推送到多个远程

### 方案三: 重新开始
**适用场景:**
- 只需要最新代码,不需要历史
- 清理冗余历史

**优点:** 仓库更干净
**缺点:** 丢失所有提交历史

---

## 🚀 方案一: 完整迁移(推荐)

### 步骤1: 创建新仓库

**在GitHub平台:**
1. 登录新账号或目标平台
2. 点击 "New repository" 或 "Create repository"
3. 填写仓库名称 (建议使用相同名称 `LX`)
4. **重要:** 不要初始化README、.gitignore、license
5. 点击 "Create repository"

**在GitLab平台:**
1. 登录GitLab
2. 点击 "New project" → "Create blank project"
3. 填写项目名称
4. **重要:** 取消勾选 "Initialize repository with README"
5. 点击 "Create project"

**在Gitee平台:**
1. 登录Gitee
2. 点击 "+" → "新建仓库"
3. 填写仓库名称
4. **重要:** 取消勾选 "使用Readme初始化仓库"
5. 点击 "创建"

### 步骤2: 迁移到新仓库

```bash
# 进入你的仓库目录
cd /path/to/LX

# 1. 查看当前远程(确认)
git remote -v

# 2. 删除旧的远程仓库
git remote remove origin

# 3. 添加新的远程仓库
# GitHub示例:
git remote add origin https://github.com/newusername/LX.git

# GitLab示例:
git remote add origin https://gitlab.com/newusername/LX.git

# Gitee示例:
git remote add origin https://gitee.com/newusername/LX.git

# 4. 验证新的远程仓库
git remote -v

# 5. 推送所有分支到新仓库
git push -u origin main

# 6. 推送所有tags(如果有)
git push origin --tags

# 7. 推送所有分支(如果有多个分支)
git push origin --all
```

### 步骤3: 验证迁移

```bash
# 1. 检查远程分支
git branch -r

# 2. 查看远程提交历史
git log origin/main --oneline -5

# 3. 确认所有文件已推送
git ls-tree -r origin/main

# 4. 在浏览器中访问新仓库确认
```

### 步骤4: 更新本地配置

```bash
# 1. 更新Git配置(如果用户名/邮箱改变)
git config user.name "Your New Name"
git config user.email "yournewemail@example.com"

# 2. 设置上游分支(跟踪)
git branch --set-upstream-to=origin/main main

# 3. 验证配置
git config --list | grep -E "user|remote"
```

### 步骤5: 处理原仓库(可选)

**如果完全删除原仓库:**
```bash
# 在GitHub/GitLab网页上操作
# Settings → Danger Zone → Delete repository
# 或者在命令行(需要权限):
# git delete https://github.com/leoliu000-AI-L/LX.git
```

**如果设为只读(保留备份):**
1. 在原仓库网页上
2. Settings → Features
3. 取消勾选 "Issues", "Wiki", "Projects"
4. 添加归档说明到README

**如果转让给他人:**
```bash
# GitHub上操作:
# Settings → Collaborators → Add people
# 或 Settings → Transfer ownership
```

---

## 🔄 方案二: 镜像迁移

### 步骤1: 添加新的远程仓库

```bash
cd /path/to/LX

# 保留原origin,添加新的远程
# 添加GitHub新仓库
git remote add new-github https://github.com/newusername/LX.git

# 添加GitLab仓库
git remote add gitlab https://gitlab.com/newusername/LX.git

# 添加Gitee仓库
git remote add gitee https://gitee.com/newusername/LX.git

# 查看所有远程
git remote -v
```

### 步骤2: 推送到多个远程

```bash
# 推送main分支到所有远程
git push origin main
git push new-github main
git push gitlab main
git push gitee main

# 推送tags到所有远程
git push origin --tags
git push new-github --tags
git push gitlab --tags
git push gitee --tags

# 推送所有分支到所有远程
git push origin --all
git push new-github --all
git push gitlab --all
git push gitee --all
```

### 步骤3: 配置同时推送(可选)

```bash
# 创建一个remote同时推送到多个仓库
git remote rename origin old-origin

# 添加新的origin指向多个URL
git remote add origin https://github.com/newusername/LX.git

# 添加额外的push URL
git remote set-url --add --push origin https://gitlab.com/newusername/LX.git
git remote set-url --add --push origin https://gitee.com/newusername/LX.git

# 现在一次推送会同时推送到所有远程
git push origin --all --tags

# 验证配置
git remote -v
git remote show origin
```

---

## 🆕 方案三: 重新开始

### 步骤1: 导出最新代码

```bash
cd /path/to/LX

# 1. 创建新目录
cd ..
mkdir LX-fresh
cd LX-fresh

# 2. 复制当前代码(不带.git历史)
cp -r ../LX/* .
cp -r ../LX/.* . 2>/dev/null || true

# 3. 查看复制的内容
ls -la
```

### 步骤2: 初始化新仓库

```bash
# 初始化Git
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit: Migrated from original repository"

# 添加远程仓库
git remote add origin https://github.com/newusername/LX.git

# 推送到远程
git push -u origin main
```

### 步骤3: 清理原仓库

```bash
cd ../LX

# 如果需要,可以删除原仓库
# rm -rf .git  # 警告! 这会删除Git历史
```

---

## 🔧 高级操作

### 迁移所有分支

```bash
# 查看所有本地分支
git branch

# 查看所有远程分支
git branch -r

# 迁移每个分支
for branch in $(git branch -r | sed 's/origin\///'); do
    git checkout $branch
    git checkout -b $branch
    git push -u origin $branch
done

# 回到main分支
git checkout main
```

### 迁移Submodules

```bash
# 查看submodules
git submodule status

# 迁移时同步submodules
git submodule sync
git submodule update --init --recursive
```

### 迁移Large File Storage (LFS)

```bash
# 检查是否使用LFS
git lfs ls-files

# 如果使用LFS,需要在新仓库安装LFS
# GitLab: https://git-lfs.github.com/
# GitHub: 自动支持
# Gitee: 需要手动配置

# 迁移LFS文件
git lfs migrate import --include="*" --everything
```

### 迁移GitHub特定功能

**Issues迁移:**
1. 使用工具: https://github.com/github/issue-mover
2. 或手动导出/导入: Settings → Issues → Export

**Wiki迁移:**
```bash
# 克隆wiki
git clone https://github.com/leoliu000-AI-L/LX.wiki.git

# 推送到新wiki
cd LX.wiki
git remote set-url origin https://github.com/newusername/LX.wiki.git
git push -u origin main
```

**Star迁移:**
- GitHub无法批量迁移star
- 只能手动通知star用户重新star

**Releases迁移:**
```bash
# 查看releases
git tag -l

# 重新创建releases
# 需要在GitHub网页上手动操作
# 或使用GitHub API批量创建
```

---

## 🌐 跨平台迁移

### GitHub → GitLab

```bash
cd /path/to/LX

# 添加GitLab远程
git remote add gitlab https://gitlab.com/newusername/LX.git

# 推送到GitLab
git push gitlab --all --tags

# 可选: 删除GitHub远程
git remote remove origin
git remote rename gitlab origin
```

### GitHub → Gitee

```bash
cd /path/to/LX

# 添加Gitee远程
git remote add gitee https://gitee.com/newusername/LX.git

# 推送到Gitee
git push gitee --all --tags

# 可选: 删除GitHub远程
git remote remove origin
git remote rename gitee origin
```

### GitHub → Bitbucket

```bash
cd /path/to/LX

# 添加Bitbucket远程
git remote add bitbucket https://bitbucket.org/newusername/LX.git

# 推送到Bitbucket
git push bitbucket --all --tags

# 可选: 删除GitHub远程
git remote remove origin
git remote rename bitbucket origin
```

---

## ⚠️ 常见问题与解决方案

### 问题1: 推送失败 - 权限错误

**错误信息:** `Permission denied (publickey)`

**解决方案:**
```bash
# 1. 生成SSH密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub

# 3. 复制公钥到平台
# GitHub: Settings → SSH and GPG keys → New SSH key
# GitLab: Settings → SSH Keys

# 4. 测试连接
ssh -T git@github.com
ssh -T git@gitlab.com

# 5. 更新远程URL为SSH
git remote set-url origin git@github.com:newusername/LX.git
```

### 问题2: 推送失败 - 分支保护

**错误信息:** `protected branch hook declined`

**解决方案:**
```bash
# 方案1: 在新仓库设置中关闭分支保护
# Settings → Branches → Branch protection → 取消保护main分支

# 方案2: 强制推送(不推荐)
git push -f origin main

# 方案3: 推送前拉取
git pull --rebase origin main
git push origin main
```

### 问题3: 提交历史丢失

**检查历史是否完整:**
```bash
# 比较本地和远程提交
git log origin/main --oneline -10
git log --oneline -10

# 如果远程历史不完整,重新推送
git push -f origin main

# 恢复丢失的提交(如果还有本地备份)
git reflog
git reset --hard HEAD@{n}
```

### 问题4: 文件太大推送失败

**错误信息:** `entity too large` 或 `packfile exceeds limit`

**解决方案:**
```bash
# 1. 查找大文件
git rev-list --objects --all |
git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize)' |
sort -n -k3 |

# 2. 移除大文件
git rm --cached large-file.zip
git commit -m "Remove large file"

# 3. 使用Git LFS
git lfs install
git lfs track "*.zip"
git add .gitattributes
git commit -m "Add Git LFS"
```

### 问题5: 子模块(submodule)丢失

**解决方案:**
```bash
# 更新子模块
git submodule update --init --recursive

# 或重新添加子模块
git submodule add https://example.com/repo.git path/to/submodule
git commit -m "Add submodule"
git push origin main
```

---

## ✅ 迁移后验证清单

### 完整性检查

- [ ] **提交历史完整** - `git log origin/main --oneline` 应显示所有提交
- [ ] **所有分支已迁移** - `git branch -r` 应显示所有分支
- [ ] **所有tags已迁移** - `git tag` 和 `git ls-remote --tags origin` 应一致
- [ ] **文件完整** - `git ls-tree -r origin/main` 应显示所有文件
- [ ] **Submodules正常** - `git submodule status` 应无异常
- [ ] **LFS文件正常** - `git lfs ls-files` 应显示LFS文件

### 功能性检查

- [ ] **可以正常clone** - 在新位置测试 `git clone`
- [ ] **可以正常pull** - 测试 `git pull`
- [ ] **可以正常push** - 测试 `git push`
- [ ] **CI/CD正常** - 如果有GitHub Actions/GitLab CI,检查是否正常运行
- [ ] **Webhooks正常** - 如果有集成服务,测试webhooks

### 测试克隆

```bash
# 在新目录测试克隆
cd /tmp
git clone https://github.com/newusername/LX.git test-clone
cd test-clone

# 验证内容
ls -la
git log --oneline -5

# 验证所有分支
git branch -a

# 清理测试目录
cd ..
rm -rf test-clone
```

---

## 📝 迁移后更新事项

### 更新README

```markdown
# 更新仓库链接
旧: https://github.com/leoliu000-AI-L/LX
新: https://github.com/newusername/LX 或 https://gitlab.com/newusername/LX

# 添加迁移说明
## Repository Migration Notice

This repository was migrated from [old repository URL] on 2026-02-25.
All commit history and branches have been preserved.
```

### 更新文档中的链接

```bash
# 查找包含旧仓库URL的文件
grep -r "leoliu000-AI-L/LX" .

# 批量替换(谨慎使用)
find . -type f -name "*.md" -exec sed -i 's|leoliu000-AI-L/LX|newusername/LX|g' {} \;

# 提交更新
git add .
git commit -m "Update repository URLs after migration"
git push origin main
```

### 更新CI/CD配置

```yaml
# .github/workflows/ci.yml 或 .gitlab-ci.yml
# 更新仓库URL和路径
name: CI
on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: newusername/LX  # 更新这里
```

### 通知协作者

```bash
# 1. 查看所有协作者
git log --format='%an' | sort -u

# 2. 发送通知邮件/消息
# 告知新仓库地址、迁移日期、注意事项
```

---

## 🎯 推荐流程

### 最安全的迁移流程

```bash
# 第一阶段: 准备 (15分钟)
1. 备份当前仓库
2. 创建新仓库(空仓库)
3. 通知协作者计划迁移

# 第二阶段: 迁移 (30分钟)
4. 添加新远程仓库
5. 推送所有分支和tags
6. 验证迁移完整性

# 第三阶段: 切换 (15分钟)
7. 更新本地远程指向新仓库
8. 更新README和文档
9. 测试clone和push功能

# 第四阶段: 清理 (可选)
10. 原仓库设为只读或删除
11. 通知所有人使用新仓库地址
```

---

## 📚 参考资源

### 官方文档
- **Git Book:** https://git-scm.com/book/
- **GitHub迁移指南:** https://docs.github.com/en/get-started/quickstart/migrate-new-repo
- **GitLab迁移指南:** https://docs.gitlab.com/ee/user/project/import/
- **Gitee迁移指南:** https://gitee.com/help/articles/4198

### 有用工具
- **GitHub Issue Mover:** https://github.com/github/issue-mover
- **Git LFS:** https://git-lfs.github.com/
- **GitHub CLI:** https://cli.github.com/
- **GitLab Runner:** https://docs.gitlab.com/runner/

### 社区资源
- **Git Stack Overflow:** https://stackoverflow.com/questions/tagged/git
- **GitHub Community:** https://github.community/
- **GitLab Forum:** https://forum.gitlab.com/

---

## 💡 最佳实践建议

### 迁移前
1. **总是先备份** - 创建完整备份
2. **通知团队成员** - 提前告知迁移计划
3. **选择非工作时间** - 减少对他人影响
4. **测试迁移流程** - 先用测试仓库练习

### 迁移中
1. **使用SSH协议** - 更安全可靠
2. **逐步验证** - 每一步都验证成功
3. **保留原远程** - 直到完全确认迁移成功
4. **记录操作日志** - 方便问题追溯

### 迁移后
1. **更新所有文档** - 包括README、Wiki、网站
2. **通知所有利益相关方** - 用户、协作者、依赖方
3. **监控运行状态** - 观察几天确保稳定
4. **删除旧仓库前等待** - 至少保留1个月

---

## 🆘 需要帮助?

如果在迁移过程中遇到问题:

1. **查看Git日志**
   ```bash
   git reflog
   git fsck --full
   ```

2. **回滚到迁移前状态**
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **恢复备份**
   ```bash
   # 从备份目录恢复
   cd ../LX-backup
   git remote set-url origin https://github.com/leoliu000-AI-L/LX.git
   git push -f origin main
   ```

---

**祝您迁移顺利!** 🎉

如有任何问题,随时询问。
