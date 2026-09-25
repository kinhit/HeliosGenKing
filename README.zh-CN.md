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

---

## 下载

HeliosGenKing 是桌面应用。请从 [Releases 发布页](https://github.com/kinhit/HeliosGenKing/releases) 下载适合你系统的最新版本，不需要注册账号、部署服务器或配置云端环境。

| 系统 | 文件 |
| --- | --- |
| **macOS（Apple Silicon）** | `HeliosGen_<version>_aarch64.dmg` |
| **Windows** | 暂未提供官方构建，欢迎贡献 Windows 构建产物 |
| **Linux** | 暂未提供官方构建，欢迎贡献 Linux 构建产物 |

目前 Releases 只包含已经上传的构建产物。macOS Apple Silicon 版本由 GitHub Actions 自动打包发布。Tauri 不能跨平台编译，因此 Windows 和 Linux 版本需要在对应系统上构建；如果你能在目标系统运行 `pnpm desktop:build`，欢迎提交 PR 或在 Issue 中附上构建产物。

当前应用尚未进行代码签名：

- **macOS**：首次运行时右键应用并选择“打开”；也可以执行 `xattr -cr /Applications/HeliosGen.app`。
- **Windows**：SmartScreen 提示时选择“更多信息 → 仍要运行”。

## 第一次运行

1. 启动 HeliosGen。
2. 打开 **设置 → API 密钥**，填写你的 [Kie.ai](https://kie.ai?ref=25abb3f2236cbff9780ab9c2f84479ec) 或 [Magnific](https://www.magnific.com/cn/api) API Key。
3. 如果需要中文界面，在设置中选择“简体中文”。
4. 开始生成图片、视频或工作流。

应用默认以本地模式运行。生成记录、上传素材、文件夹、工作流和设置保存在本机数据库，媒体文件保存在本机目录：

| 系统 | 数据目录 |
| --- | --- |
| macOS | `~/Library/Application Support/cash.sdd.helios.desktop/` |
| Windows | `%APPDATA%\\cash.sdd.helios.desktop\\` |
| Linux | `~/.local/share/cash.sdd.helios.desktop/` |

删除对应目录会重置应用，请先备份需要保留的数据。

---

## 截图

### 图片与视频生成

<p align="center">
  <img width="2912" height="2292" alt="图片生成示例" src="https://github.com/user-attachments/assets/8263b83d-addb-4af8-99d1-d8406c52be2c" />
</p>

### 工作流生成

<p align="center">
  <img width="1459" height="1146" alt="工作流生成示例" src="https://github.com/user-attachments/assets/fc7f1109-76d1-4af0-b91d-0e915bcf5461" />
</p>

### 原生 JSON 提示词预览

<p align="center">
  <img width="886" alt="JSON 提示词预览" src="https://github.com/user-attachments/assets/dedbdf4f-9d52-4e29-ad6e-a2e67e341a73" />
</p>

### AI 提示词优化助手

<p align="center">
  <img width="872" height="502" alt="提示词助手界面" src="https://github.com/user-attachments/assets/17ba972c-bd8a-49a7-b367-4ef906fe3e17" />
</p>

## 本版本的定制内容

HeliosGenKing 在保留原有工作流画布、图片/视频生成、素材库和 Tauri 桌面端的基础上，增加了：

- English / 简体中文语言选择，语言偏好保存在本地。
- Magnific API 密钥管理入口。
- Magnific 图片模型：Google Nano Banana 2、Google Nano Banana Pro、GPT Image 2、GPT Image 2.5 Flare、GPT Image 2.5 Sunburst、Qwen Image 3.0、Qwen Image 3.0 Pro。
- Magnific 视频模型：Seedance 2.5、2.0、2.0 Fast、2.0 Mini、Wan 3.0、Wan 3.0 Prime、MiniMax H3、H3 Max、H3 Max Turbo。
- Seedance 2.5 提供 Draft（480p）低成本草稿预设。
- Zhipu AI 的 GLM-5.3-Flash 文本模型。
- 本地图片在图生视频前上传到 Magnific 临时素材服务，结果再保存回本地媒体库。
- 使用 SQLite 保存本地生成任务和远程任务 ID，应用重启后可以继续轮询未完成任务。

Magnific 接口参考官方文档：[完整 API 文档](https://docs.magnific.com/llms-full.txt)、[文件上传](https://docs.magnific.com/upload-files)、[图像模型](https://www.magnific.com/ai/docs/image-ai-models)、[视频模型](https://www.magnific.com/ai/docs/video-ai-models)。

### Magnific 公开积分参考价

生成节点会在模型菜单和控制栏显示 Magnific 公开计费参考值；视频会按当前分辨率和时长估算单次费用。当前公开资料列出的参考价如下：

| 模型 | 公开参考消耗 |
| --- | --- |
| Nano Banana 2 / Pro | 1K、2K：75；4K：150 积分/张 |
| GPT Image 2 / 2.5（含 Flare、Sunburst） | 15–1,000 积分/张 |
| Qwen Image 3.0 | 50 积分/张 |
| Qwen Image 3.0 Pro | 官方积分页未列出，应用会显示“费用未公开” |
| Seedance 2.5 | Draft、480p：200；720p：440；1080p：1,100 积分/秒 |
| Seedance 2.0 | 480p：145；720p：280；1080p：700；4K：1,400 积分/秒 |
| Seedance 2.0 Fast | 480p：120；720p：235 积分/秒 |
| Seedance 2 Mini | 480p：70；720p：140 积分/秒 |
| Wan 3.0 | 480p：60；720p：120；1080p：240 积分/秒 |
| Wan 3.0 Prime | 480p：100；720p：200；1080p：400 积分/秒 |
| MiniMax H3 | 480p：75；768p：92；2K：110 积分/秒 |
| MiniMax H3 Max | 480p：55；768p：80；2K：150 积分/秒 |
| MiniMax H3 Max Turbo | 480p：12；768p：20 积分/秒 |

这些是 Magnific 公开页面中的参考值，不保证与每个 API 账号、订阅方案或促销期间的实际扣费完全一致。Seedance 2.5 的参考视频时长也可能计入计费时长；最终以 Magnific 账户账单为准。参考：[图片计费](https://www.magnific.com/ai/docs/ai-image-generator-credits)、[视频计费](https://www.magnific.com/ai/docs/ai-video-generator-credits)。新加入的 Wan 3.0、MiniMax H3 系列及 Qwen Image 3.0 系列尚未全部出现在公开 API endpoint 目录中，代码按 Magnific 已公开模型能力和现有异步接口约定接入；实际可用性还取决于你的 API 账号权限与服务端 endpoint 开放情况。

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
ZHIPU_API_KEY=
```

不要把真实 API Key 提交到 Git。应用默认把生成记录、设置和媒体保存在本机；Magnific 图生视频的临时 `asset_url` 不会长期写入本地数据库。

## 项目简介

HeliosGenKing 是一个免费、开源的可视化 AI 图片与视频工作流构建器。

你可以使用它创建可复用的 AI 流程：

- 无限画布节点工作流；
- 多模型图片和视频生成；
- 参考图片、参考视频和参考音频；
- 并行或串行的自动化生成链；
- 所有本地应用数据保存在自己的设备上。

应用不收取订阅费，不会清空未使用积分，也不会把你的工作流锁定在某个界面中。你只需要准备自己的模型服务商 API Key。

## 积分与服务商

HeliosGenKing 支持 [Kie.ai](https://kie.ai?ref=25abb3f2236cbff9780ab9c2f84479ec) 服务。Kie.ai 积分直接购买并归属于你自己的账号，按实际生成量使用，不会因为订阅周期结束而清空。Magnific 模型则使用你自己的 Magnific API Key，具体计费和额度以服务商页面为准。

## 功能

- 无限节点画布；
- AI 图片和视频生成；
- 拖拽连接式工作流；
- 多模型组合流程；
- 参考图片、参考视频和参考音频；
- 并行和串行工作流执行；
- 实时生成历史记录；
- 本地优先，应用数据默认不离开本机；
- 自带 API Key；
- 现代化响应式界面；
- English / 简体中文界面切换；
- macOS Apple Silicon DMG 自动发布。

## 支持的模型

### 图片

- GPT Image 2（OpenAI）
- Nano Banana、Nano Banana 2、Nano Banana 2 Lite、Nano Banana Pro（Google）
- Seedream 5.0 Lite / Pro（Seedream）
- Z-Image（Z-AI）
- Grok Imagine（X）
- Magnific Google Nano Banana 2、Google Nano Banana Pro
- Magnific GPT Image 2、GPT Image 2.5 Flare、GPT Image 2.5 Sunburst

### 视频

- Veo 3.1 Lite / Fast / Quality、Gemini Omni Video（Google）
- Kling 3.0、Kling 3.0 Turbo、Motion Control 2.6 / 3.0（Kling）
- Seedance 2.0 / Fast / Mini（Bytedance）
- Grok Imagine、Grok Imagine 1.5 Preview（X）
- HappyHorse（Alibaba）
- Magnific Seedance 2.5、2.0、2.0 Fast、2.0 Mini

### 文本

- GLM-5.3-Flash（智谱 AI / BigModel）

> Magnific 官方 API 的正式名称是“GPT Image 2”和“GPT Image 2.5”，其中 GPT Image 2.5 在界面中拆分为 Flare 和 Sunburst 两个变体。另外，Magnific 文档将 Nano Banana 2 映射为 Nano Banana Pro Flash API 接口，代码已使用该正式接口路径。参考素材上传仅接受 PNG、JPEG、WebP、MP4、WebM、MOV、MP3、WAV、M4A 和 OGG；不兼容格式会在提交生成前给出明确提示。

Magnific 的 Seedance 2.5 最多支持 30 张参考图、10 个参考视频和 10 个参考音频；Seedance 2.0、2.0 Fast、2.0 Mini 最多支持 9 张参考图、3 个参考视频和 3 个参考音频。参考图/视频与首尾帧模式不能同时使用；音频是否可以与首尾帧组合，会根据具体模型规则校验。GPT Image 2 和 GPT Image 2.5 在附加参考图时使用对应的编辑接口。

GLM-5.3-Flash 的 API Key 可在 **设置 → API 密钥 → Zhipu AI** 中配置；它使用智谱 BigModel 官方的 OpenAI 兼容接口。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 桌面外壳 | Tauri 2（Rust） |
| 应用界面 | Next.js + React + TypeScript（内置 Node sidecar） |
| 数据库 | 本地 SQLite |
| 文件存储 | 本地磁盘 |
| AI 后端 | Kie.ai 和 Magnific |

## 语言设置

应用包含 English 和简体中文。打开设置窗口选择语言后，偏好会保存在本地，下一次启动会继续使用该语言。

## Magnific 接口说明

参考素材在提交生成前会上传到 Magnific 的临时素材服务，生成结果下载后再保存到 HeliosGen 本地媒体库。Magnific Seedance 2.5 最多支持 30 张参考图、10 个参考视频和 10 个参考音频；Seedance 2.0、2.0 Fast、2.0 Mini 最多支持 9 张参考图、3 个参考视频和 3 个参考音频。参考图/视频与首尾帧模式不能同时使用；音频是否可以与首尾帧组合，会根据具体模型规则校验。

Magnific 支持的参考素材格式包括 PNG、JPEG、WebP、MP4、WebM、MOV、MP3、WAV、M4A 和 OGG。GPT Image 2 和 GPT Image 2.5 连接参考图时使用对应的编辑接口。Magnific Mystic、LTX 2.0 Pro 和 Kling 2.6 Pro 已移除，因为当前 Magnific API 能力不能与工作流功能完整对齐。

## 版本号管理

每次发布前都必须递增版本号。项目提供自动同步脚本，会同时更新
`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 和
`src-tauri/Cargo.lock`：

```bash
pnpm version:patch       # 修复版本，例如 1.5.0 → 1.5.1
pnpm version:minor       # 功能版本，例如 1.5.0 → 1.6.0
pnpm version:major       # 重大版本，例如 1.5.0 → 2.0.0
pnpm version:bump 1.6.0  # 直接指定版本号
pnpm version:check       # 检查所有文件是否一致
```

脚本不会自动创建或推送 Git 标签。确认改动后，再创建类似 `v1.5.1` 的发布标签；
GitHub Actions 会自动检查标签版本和桌面安装包版本是否一致。

发布前请在 `CHANGELOG.md` 中增加对应版本的详细条目。发布工作流会自动读取该条目、版本范围内的提交记录和文件变更摘要，生成 Releases 页面的完整更新说明，并附上可点击的 Full Changelog 对比链接。

## Codex CLI（可选的 GPT Image 2 后端）

除了使用 Kie.ai 积分，HeliosGenKing 也可以通过自己的 ChatGPT Codex 订阅，使用 [`codex-imagegen-cli`](https://github.com/jdmnk/codex-imagegen-cli) 生成 GPT Image 2。桌面应用会自动从 `PATH` 查找 `codex-imagegen`；如果没有安装，该功能会显示“未配置”，其他功能不受影响。

需要：

- 有 Codex 权限的 ChatGPT Plus、Pro、Team 或 Enterprise 账号；
- 已安装 [`codex`](https://github.com/openai/codex) CLI；
- 已安装 [`uv`](https://docs.astral.sh/uv/) Python 包管理器。

### 安装 Codex CLI

```bash
# macOS
brew install codex

# 或者跨平台安装
npm install -g @openai/codex
```

### 安装 codex-imagegen-cli

```bash
git clone https://github.com/jdmnk/codex-imagegen-cli.git
cd codex-imagegen-cli
uv sync --dev
uv tool install -e .
```

这会安装 `codex-imagegen` 命令，请确认它位于你的 `PATH` 中。然后可以在终端运行 `codex login`，或打开应用的 **设置 → API 密钥 → Codex CLI → Connect Codex**，按设备码流程完成登录。

> ⚠️ 开始新的登录会立即使本机已有会话失效，无论这次登录是否完成。只有当状态显示“未配置”时，才应开始新的登录流程。

打开 **设置 → 图片模型**，将 GPT Image 2 的服务商切换为 **Codex CLI**。当 CLI 已安装并完成登录后，状态会显示“就绪”。

## 从源码构建

Tauri 不能跨平台编译：macOS 目标请在 macOS 构建，Windows 目标请在 Windows 构建，Linux 目标请在 Linux 构建。

### 环境要求

| 工具 | 说明 |
| --- | --- |
| **Node.js 22+** | 内置服务使用 `node:sqlite`，建议使用 `nvm use 22`。 |
| **Rust** | 参考 Tauri 2 安装方式。 |
| **Tauri 系统依赖** | 参考 <https://v2.tauri.app/start/prerequisites/>。 |

macOS 需要 Xcode Command Line Tools（`xcode-select --install`）；Windows 需要 Microsoft C++ Build Tools 和 WebView2；Linux 需要 `webkit2gtk-4.1`、`librsvg2`、`build-essential`、`curl`、`wget`、`file`、`libssl-dev`、`libayatana-appindicator3-dev` 等依赖。

### 构建命令

```bash
git clone https://github.com/kinhit/HeliosGenKing.git
cd HeliosGenKing
corepack enable
pnpm install
pnpm desktop:build
```

构建产物位于 `src-tauri/target/release/bundle/`：

| 系统 | 产物 |
| --- | --- |
| macOS | `macos/HeliosGen.app`、`dmg/HeliosGen_<ver>_<arch>.dmg` |
| Windows | `msi/HeliosGen_<ver>_x64_en-US.msi`、`nsis/HeliosGen_<ver>_x64-setup.exe` |
| Linux | `deb/`、`rpm/`、`appimage/HeliosGen_<ver>_amd64.AppImage` |

macOS 构建默认未签名。首次启动时如果被 Gatekeeper 拦截，可以右键选择“打开”，或者执行：

```bash
xattr -cr "src-tauri/target/release/bundle/macos/HeliosGen.app"
```

### 开发模式与快速测试

```bash
pnpm desktop:dev
```

该命令会同时运行 `next dev` 和 `tauri dev`，支持热更新。日常修复建议优先使用开发模式测试，不必每次都重新打包 DMG；验证通过后再递增版本、构建并推送版本标签。

## 本地数据位置

| 操作系统 | 数据目录 |
| --- | --- |
| macOS | `~/Library/Application Support/cash.sdd.helios.desktop/` |
| Windows | `%APPDATA%\cash.sdd.helios.desktop\` |
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

## 参与贡献

欢迎提交 Issue、Pull Request 或反馈。如果你能提供 Windows / Linux 构建产物，或者发现视频模型接口与服务商文档不一致，也欢迎附上复现步骤、模型名称和错误信息。

## 开源协议

本项目沿用上游的 MIT License。二次开发内容由本仓库维护者负责维护。
