# nuxt-css-obfuscator

一个为 Nuxt.js 应用程序设计的 CSS 类名混淆器，灵感来自 [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator)。

## 🎉 特性

- ✅ 支持 Nuxt 3 和 Nuxt 4
- ✅ 混淆 CSS 类名和 ID
- ✅ 支持多种混淆模式（随机、简化）
- ✅ 支持标记器的部分混淆
- ✅ 在保持功能的同时使 CSS 更难以逆向工程
- ✅ 支持 CLI 和 Nuxt 模块

## ⚠️ 重要提示

> **警告**：此包不保证适用于所有项目。在生产环境使用前请彻底测试。

> **注意**：作为权衡，混淆会使您的 CSS 文件变大。

## 📦 安装

```bash
npm install -D nuxt-css-obfuscator
```

## 🚀 快速开始

### 方法 1：作为 Nuxt 模块

1. 在 `nuxt.config.ts` 中添加模块：

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-css-obfuscator'],
  cssObfuscator: {
    enable: true,
    mode: 'random',
    refreshClassConversionJson: false,
  }
})
```

2. 构建项目：

```bash
npm run build
```

混淆将在构建完成后自动运行。

### 方法 2：使用 CLI

1. 创建配置文件 `nuxt-css-obfuscator.config.js`：

```javascript
/** @type {import('nuxt-css-obfuscator').Options} */
module.exports = {
  enable: true,
  mode: 'random',
  refreshClassConversionJson: false,
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs'],
};
```

2. 在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "obfuscate": "nuxt-css-obfuscator",
    "build": "nuxt build && npm run obfuscate"
  }
}
```

3. 构建并混淆：

```bash
npm run build
```

## 📖 配置选项

### 基础选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enable` | `boolean` | `true` | 启用或禁用混淆 |
| `mode` | `'random' \| 'simplify' \| 'simplify-seedable'` | `'random'` | 混淆模式 |
| `buildFolderPath` | `string` | `'.output'` | 构建文件夹路径 |
| `classConversionJsonFolderPath` | `string` | `'./css-obfuscator'` | 存储转换表的文件夹 |
| `refreshClassConversionJson` | `boolean` | `false` | 每次构建时刷新转换表 |
| `classLength` | `number` | `5` | 混淆类名的长度（随机模式） |

### 高级选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `prefix` | `string \| PrefixSuffixOptions` | `{ selectors: '', idents: '' }` | 混淆名称的前缀 |
| `suffix` | `string \| PrefixSuffixOptions` | `{ selectors: '', idents: '' }` | 混淆名称的后缀 |
| `ignorePatterns` | `IgnorePatterns` | `{ selectors: [], idents: [] }` | 要忽略的模式 |
| `allowExtensions` | `string[]` | `['.vue', '.js', '.ts', ...]` | 要处理的文件扩展名 |
| `whiteListedFolderPaths` | `Array<string \| RegExp>` | `[]` | 仅混淆这些文件夹中的文件 |
| `blackListedFolderPaths` | `Array<string \| RegExp>` | `['./.output/cache']` | 不混淆这些文件夹中的文件 |
| `enableMarkers` | `boolean` | `false` | 启用标记器的部分混淆 |
| `markers` | `string[]` | `['nuxt-css-obfuscation']` | 标记器类名 |
| `removeMarkersAfterObfuscated` | `boolean` | `true` | 混淆后移除标记器 |
| `removeOriginalCss` | `boolean` | `false` | 如果已混淆则移除原始 CSS |
| `generatorSeed` | `number \| undefined` | `undefined` | 随机生成器的种子 |
| `enableJsAst` | `boolean` | `true` | 启用 JavaScript AST 解析 |
| `logLevel` | `'silent' \| 'error' \| 'warn' \| 'info' \| 'debug'` | `'info'` | 日志级别 |

## 🎯 使用示例

### 完全混淆

```javascript
// nuxt-css-obfuscator.config.js
module.exports = {
  enable: true,
  mode: 'random',
  refreshClassConversionJson: false,
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs'],
};
```

### 部分混淆

```javascript
// nuxt-css-obfuscator.config.js
module.exports = {
  enable: true,
  mode: 'random',
  enableMarkers: true,
  markers: ['nuxt-css-obfuscation'],
};
```

然后在 Vue 组件中：

```vue
<template>
  <div>
    <!-- 这部分不会被混淆 -->
    <div class="container mx-auto">
      <h1 class="text-2xl">普通内容</h1>
    </div>
    
    <!-- 这部分会被混淆 -->
    <div class="nuxt-css-obfuscation container mx-auto">
      <h1 class="text-2xl">混淆内容</h1>
    </div>
  </div>
</template>
```

## 💡 提示

### 1. 开发环境 vs 生产环境

在开发环境中设置 `refreshClassConversionJson: true`，在生产环境中设置为 `false`：

```javascript
module.exports = {
  enable: process.env.NODE_ENV === 'production',
  refreshClassConversionJson: process.env.NODE_ENV !== 'production',
};
```

### 2. 添加到 .gitignore

```
/css-obfuscator
```

### 3. 不要连续运行两次混淆

在没有重新构建的情况下，永远不要连续运行两次混淆命令。这会破坏转换表。

### 4. 缓存问题

如果混淆似乎不起作用，请尝试：
- 删除 `.output/cache` 文件夹
- 硬刷新浏览器（Shift + F5）

## 🔧 CLI 选项

```bash
nuxt-css-obfuscator [选项]

选项:
  -c, --config <path>      配置文件路径
  -d, --dir <path>         项目目录（默认：当前目录）
  --build-dir <path>       构建目录（覆盖配置）
  --log-level <level>      日志级别（silent|error|warn|info|debug）
  -h, --help               显示帮助
  -V, --version            显示版本
```

## 🤔 工作原理

1. **提取 CSS**：从构建输出中解析 CSS 文件
2. **混淆**：生成混淆的类名并保存映射
3. **替换**：在所有构建文件中搜索并替换类名

与 PostCSS-Obfuscator 创建单独文件夹不同，此包直接编辑构建文件以确保与 Nuxt 的兼容性。

## 📝 许可证

MIT

## 🙏 致谢

灵感来自 [@soranoo](https://github.com/soranoo) 的 [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator)。
