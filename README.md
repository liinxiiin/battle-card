# Eternal Frontline (永恒前线)

一款基于 React + Vite + TypeScript 构建的策略卡牌自动对战游戏。利用 Google Gemini API 实现动态的敌人生成和卡牌描述。

## 📋 目录
- [本地开发](#本地开发)
- [环境配置](#环境配置)
- [部署到 GitHub Pages](#部署到-github-pages)
- [项目结构](#项目结构)

## 🚀 本地开发

### 1. 安装依赖
确保您已安装 Node.js (推荐 v18+)。
```bash
npm install
```

### 2. 配置 API Key
在项目根目录下创建一个 `.env` 文件，填入您的 Google Gemini API Key：
```env
API_KEY=你的_API_KEY_粘贴在这里
```
> **注意**：如果没有 API Key，游戏将自动回退到程序化生成的“伪随机”模式，您仍然可以体验游戏核心玩法。

### 3. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问显示的本地地址（通常是 `http://localhost:5173`）。

## 📦 部署到 GitHub Pages

由于本项目是纯静态前端应用，非常适合部署到 GitHub Pages。

### 准备工作
确保 `vite.config.ts` 中的 `base` 配置正确。目前已配置为相对路径 `'./'`，这通常能适配大多数 GitHub Pages 场景。
```typescript
// vite.config.ts
export default defineConfig({
  base: './', 
  // ...
})
```

### 方式一：使用 `gh-pages` 脚本（推荐）

这是最简单的自动化部署方式。

1. **安装部署工具**
   ```bash
   npm install gh-pages --save-dev
   ```

2. **修改 `package.json`**
   在 `scripts` 部分添加以下两行：
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist",
     // ... 其他脚本保持不变
   }
   ```

3. **一键部署**
   ```bash
   npm run deploy
   ```
   脚本会自动运行构建命令，并将生成的 `dist` 文件夹推送到远程仓库的 `gh-pages` 分支。

4. **GitHub 设置**
   - 进入 GitHub 仓库页面 -> **Settings** -> **Pages**。
   - 在 **Build and deployment** 下，将 **Source** 设置为 `Deploy from a branch`。
   - 将 **Branch** 选择为 `gh-pages` / `/root`。

### 方式二：GitHub Actions 自动构建

如果您希望通过 Git Push 自动触发构建：

1. 在仓库中创建文件 `.github/workflows/deploy.yml`。
2. 填入以下内容：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Dependencies
        run: npm install
      - name: Build
        run: npm run build
        env:
          # 如果您想在构建中注入 Key (注意安全风险)
          API_KEY: ${{ secrets.API_KEY }} 
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### ⚠️ 关于 API Key 的安全提示

由于这是一个纯前端项目：
1. **构建时注入**：如果在本地构建时 `.env` 包含 Key，或者在 GitHub Actions 中注入了 Secret，Key 会被打包进最终的 JS 代码中。对于公开仓库，这意味着任何人都能在浏览器控制台看到您的 Key。
2. **最佳实践**：建议不要在公开的 GitHub Pages 版本中包含付费的 API Key。您可以：
   - 使用受限的 API Key（限制 HTTP Referrer 为您的 GitHub Pages 域名）。
   - 或者在代码中添加一个输入框，让玩家输入自己的 Key。

## 📂 项目结构

*   `src/` (核心代码)
    *   `components/` - React 组件 (Card, BattleField, GameUI)
    *   `services/` - Gemini API 调用逻辑
    *   `types.ts` - TypeScript 类型定义
    *   `constants.ts` - 游戏数值与常量
*   `dist/` - 构建产物 (部署用)
