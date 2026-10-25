# English Sentence Trainer · 英语范文句式背诵练习器

> 在图书馆里没法开口背书？把范文喂给它，AI 帮你把每一句拆成可复用的句式骨架，换不同主题让你填空造句，在打字中把整篇范文"背"下来。

![tech](https://img.shields.io/badge/React-19-61dafb) ![tech](https://img.shields.io/badge/Vite-8-646cff) ![tech](https://img.shields.io/badge/TypeScript-5.9-3178c6) ![tech](https://img.shields.io/badge/Tailwind-4-38bdf8)

## 这是什么

一个面向英语写作学习者的轻量网页工具，适合在图书馆、自习室等**不能出声朗读**的场景下背诵雅思 / 四六级 / 考研范文。

核心思路不是死记硬背整篇，而是：

1. **拆句式**：上传一篇范文，AI 逐句分析，把"跨主题永远能用"的固定句型骨架抽出来，剔掉主题词和具体状语；
2. **挖空练**：每句换 2-3 个完全不同的主题（原范文讲 AI，就换环保、远程办公、社交媒体），你在虚线上填空造句；
3. **AI 批改**：提交后指出语法/搭配错误，给正确示范和语法讲解；
4. **整篇套**：所有句子练完，把整篇骨架套到一个全新主题上，改写成一篇新文章。

## 功能一览

- 📋 粘贴 / 上传范文，AI 自动提取句式骨架
- 👆 点击任意英文单词弹出中文释义（词性 + 意思）
- 🔊 单词和句子都可朗读（浏览器原生 TTS，适合跟读）
- 📈 逐句递进式练习，过关才解锁下一句
- 🗂 我的范文库：自动保存练过的范文，随时回来接着背
- 📱 手机浏览器友好，添加到主屏幕像 App 一样用

## 在线体验

直接访问：[https://4mbw1mnykspbd.doubao.link/app/app_17gs4ne1ukz](https://4mbw1mnykspbd.doubao.link/app/app_17gs4ne1ukz)

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- 状态与进度：localStorage
- 语音：浏览器原生 Web Speech API
- AI 能力：部署平台提供的大模型插件（范文拆解、主题生成、填空批改、语法讲解、整篇批改、单词释义）

## 在本地跑

```bash
npm install
npm run dev
```

> **注意**：本项目最初构建于飞书妙搭（Lark Base）低代码平台，AI 能力调用依赖平台提供的插件运行时（`@lark-apaas/client-toolkit-lite`）。直接 clone 后，前端界面能跑通，但 AI 相关功能（句式提取、批改等）需要你自己接入兼容的大模型 API，并替换 `shared/capabilities/` 下对应的调用逻辑。UI 层和练习流程不依赖平台，可自由改造。

## 目录结构

```
src/
├── components/
│   ├── PasteEssaySection.tsx      # 粘贴范文
│   ├── TemplateListSection.tsx   # 句式模板预览
│   ├── SentenceDrillSection.tsx   # 逐句挖空练习
│   ├── FullEssaySection.tsx       # 整篇套用
│   ├── EssayLibraryDialog.tsx    # 我的范文库
│   ├── WordLookup.tsx            # 点词查义
│   └── SpeakButton.tsx           # TTS 朗读按钮
shared/
└── capabilities/                  # AI 能力调用（需自行接入）
```

## License

MIT
