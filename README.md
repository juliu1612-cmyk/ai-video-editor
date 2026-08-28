# AI 智能混剪

参照 [DramaBurst](https://dramaburst.ai) 风格打造的 AI 视频剪辑工具前端原型。

## 功能场景

六大 AI 剪辑场景(当前「替换 Logo」已可交互体验,其余为敬请期待):

| 分类 | 功能 | 状态 |
|---|---|---|
| 素材加工 | 替换 Logo(识别 → 拖拽调整 → 批量成片) | ✅ 可用 |
| 素材加工 | 水印打码 | 🔜 敬请期待 |
| 素材加工 | AI 前贴生成 | 🔜 敬请期待 |
| 混剪创作 | 混剪剧情 | 🔜 敬请期待 |
| 混剪创作 | 混剪剧情 + BGM | 🔜 敬请期待 |
| 混剪创作 | 混剪 + 引流小标题 | 🔜 敬请期待 |

核心交互(替换 Logo 场景):

- **批量上传** 原素材视频(可一次多选)
- 新 Logo 图片选填,支持在识别后通过「全局新 Logo」栏统一替换
- 视频播放预览 + 红框内实时等比缩放展示新 Logo
- Pointer Events 拖拽红框改位置/大小(与视频控制条互不遮挡)
- 多成片结果页:单独下载 / 批量下载 / 自动入「成片」列表(含制作时间、制作人)

## 技术栈

- React 19 + TypeScript + Vite 8
- Ant Design 5 + @ant-design/icons
- `vite-plugin-singlefile` 打包为**单文件 HTML**(CSS/JS 全内联,双击 `file://` 可直接打开)

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 产物:dist/index.html(单文件)
```

## 部署(GitHub Pages)

推送到 `main` 分支即自动部署(GitHub Actions):

`.github/workflows/deploy.yml` 执行 `npm ci && npm run build`,将 `dist` 发布到 GitHub Pages。

仓库 Settings → Pages → Source 选择 **GitHub Actions** 即可。

## 说明

- 演示数据为 mock:素材/成片 URL 指向公共样例视频
- 下载优先 `fetch blob → <a download>`,跨域受限时回退新窗口打开
