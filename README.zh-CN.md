# HeliosGenKing

简体中文说明 | [English README](README.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/kinhit/HeliosGenKing/main/public/HG.svg" alt="HeliosGenKing" width="64" />
</p>

<p align="center">
  <strong>可视化构建 AI 图片与视频工作流。</strong><br/>
  在无限画布中连接提示词、模型、参考素材和自动化流程。
</p>

> 本项目基于 [SegFault42/HeliosGen](https://github.com/SegFault42/HeliosGen) 二次开发，当前维护仓库为 [kinhit/HeliosGenKing](https://github.com/kinhit/HeliosGenKing)。它不是上游官方发行版。

[![English](https://img.shields.io/badge/README-English-blue)](README.md) [![简体中文](https://img.shields.io/badge/README-简体中文-red)](README.zh-CN.md)

## 本版本的定制内容

HeliosGenKing 在保留原有工作流画布、图片/视频生成、素材库和 Tauri 桌面端的基础上，增加了：

- English / 简体中文语言选择，语言偏好保存在本地。
- Magnific API 密钥管理入口。
- Magnific Mystic 图片模型：Realism、Fluid、Flexible、Zen。
- Magnific LTX Video 2.0 Pro：文生视频和图生视频。
- Magnific Kling 2.6 Pro：视频生成、画面比例、时长和音频选项。
- 本地图片在图生视频前上传到 Magnific 临时素材服务，结果再保存回本地媒体库。
- 使用 SQLite 保存本地生成任务和远程任务 ID，应用重启后可以继续轮询未完成任务。

Magnific 接口参考官方文档：[API 文档](https://docs.magnific.com/llms.txt)、[文件上传](https://docs.magnific.com/upload-files)、[Mystic](https://docs.magnific.com/api-reference/mystic/post-mystic)、[LTX 视频](https://docs.magnific.com/api-reference/text-to-video/ltx-2-pro)。

## 快速开始

### 从源码运行

环境要求：Node.js 22+、pnpm 9、Rust，以及 Tauri 2 的系统依赖。

```bash
git clone https://github.com/kinhit/HeliosGenKing.git
cd HeliosGenKing
corepack enable
pnpm install
pnpm desktop:dev
```

只运行 Next.js 开发服务器：

```bash
pnpm dev
```

构建当前操作系统的桌面安装包：

```bash
pnpm desktop:build
```

Tauri 不能跨平台编译，请在目标系统上构建。构建产物位于 `src-tauri/target/release/bundle/`。

### 配置 API 密钥

启动应用后打开 **设置 → API 密钥**：

1. 使用 Kie.ai 模型时，填写 Kie.ai API Key。
2. 使用 Magnific 模型时，填写 Magnific API Key。
3. 在设置左侧选择 **简体中文**。

开发环境也可以参考 `.env.example`：

```env
KIE_API_KEY=
MAGNIFIC_API_KEY=
AZURE_API_KEY=
```

不要把真实 API Key 提交到 Git。应用默认把生成记录、设置和媒体保存在本机；Magnific 图生视频的临时 `asset_url` 不会长期写入本地数据库。

## 支持的模型

### 图片

- GPT Image 2（OpenAI）
- Nano Banana、Nano Banana 2、Nano Banana 2 Lite、Nano Banana Pro（Google）
- Seedream 5.0 Lite / Pro（Seedream）
- Z-Image（Z-AI）
- Grok Imagine（X）
- Magnific Mystic：Realism / Fluid / Flexible / Zen

### 视频

- Veo 3.1 Lite / Fast / Quality、Gemini Omni Video（Google）
- Kling 3.0、Kling 3.0 Turbo、Motion Control 2.6 / 3.0（Kling）
- Seedance 2.0 / Fast / Mini（Bytedance）
- Grok Imagine、Grok Imagine 1.5 Preview（X）
- HappyHorse（Alibaba）
- Magnific LTX Video 2.0 Pro：文生视频 / 图生视频
- Magnific Kling 2.6 Pro：图生视频和音频生成

## 本地数据位置

| 操作系统 | 数据目录 |
| --- | --- |
| macOS | `~/Library/Application Support/cash.sdd.helios.desktop/` |
| Windows | `%APPDATA%\\cash.sdd.helios.desktop\\` |
| Linux | `~/.local/share/cash.sdd.helios.desktop/` |

删除对应目录会清空本地生成记录、设置、工作流和媒体文件，请先备份需要保留的内容。

## 如何跟进上游 HeliosGen 更新

上游项目地址：<https://github.com/SegFault42/HeliosGen>

### 当前仓库关系

本仓库是基于上游源码快照重新初始化的仓库，当前 `main` 没有继承上游的 commit ancestry。因此：

- `git pull upstream main` 不能直接作为安全同步方案。
- 不要直接用上游 `main` 覆盖本仓库 `main`，否则可能丢失 Magnific 和简体中文改动。
- 每次同步都应使用独立分支，先比较差异，再逐项合并。

### 第一次配置上游远端

```bash
git remote -v
git remote add upstream https://github.com/SegFault42/HeliosGen.git
git fetch upstream --prune
```

如果提示 `upstream already exists`，说明已经配置过，直接执行 `git fetch upstream --prune` 即可。

### 推荐的日常同步流程

```bash
# 确认没有未提交修改并获取上游代码
git status
git fetch upstream --prune

# 每次同步使用独立分支
git switch -c upstream-sync/2026-09-18

# 查看上游变化，先看统计，再看具体文件
git diff --stat HEAD upstream/main
git diff HEAD upstream/main -- app lib components src-tauri
```

由于当前仓库与上游没有共同历史，第一次同步建议采用“文件级比较 + 手工移植”：以 `upstream/main` 为通用功能来源，将上游新增或修复移植到同步分支，同时保留本仓库定制逻辑。

需要重点保护的定制文件：

```text
README.zh-CN.md
components/LanguageProvider.tsx
lib/i18n.ts
lib/magnific.ts
lib/magnificUpload.ts
lib/magnificJobPoller.ts
lib/getMagnificKey.ts
app/api/settings/magnific-key/route.ts
app/api/generate/route.ts
app/api/generate-video/route.ts
app/api/job-status/route.ts
lib/modelConfig.ts
lib/guest/db.ts
lib/guest/sqlite.ts
```

### 更适合长期维护的共同历史方案

如果以后需要频繁跟进上游，建议做一次共同历史迁移：

1. 给当前版本建立备份标签或分支，例如 `heliosgenking-before-upstream-history`。
2. 以 `upstream/main` 作为新的基础分支。
3. 将 Magnific、简体中文和其他定制内容整理成独立提交重新应用。
4. 之后使用普通的 `git merge upstream/main` 或定期 `git rebase upstream/main`。

在迁移完成前，不建议直接使用 `git merge --allow-unrelated-histories` 合并整个上游仓库，因为首次合并会产生大量无共同祖先冲突。

### 每次同步后的检查清单

```bash
pnpm exec tsc --noEmit
pnpm exec eslint app/api/generate/route.ts app/api/generate-video/route.ts lib/magnific.ts lib/magnificUpload.ts
pnpm build
```

同时确认：Magnific API Key 可保存和删除；Magnific 图片/视频模型仍在模型列表；本地素材仍会先上传；应用重启后任务仍能恢复轮询；English / 简体中文切换仍然有效。

## 项目结构

| 目录 | 作用 |
| --- | --- |
| `app/api/` | 图片、视频、任务状态、设置等服务端接口 |
| `components/` | 画布、设置、模型节点和界面组件 |
| `lib/modelConfig.ts` | 图片与视频模型定义 |
| `lib/magnific*.ts` | Magnific 请求、素材上传和异步轮询 |
| `lib/i18n.ts` | English / 简体中文文案 |
| `lib/guest/` | SQLite、本地设置和媒体索引 |
| `src-tauri/` | Tauri 桌面端外壳 |

## 开源协议

本项目沿用上游的 MIT License。二次开发内容由本仓库维护者负责维护。
