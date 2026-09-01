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

> **注意**：安全默认值 `removeOriginalCss: false` 会保留原规则并追加混淆规则，因此 CSS 会变大。只有在完整验收生产产物后才建议设为 `true`。

Nuxt 模块会在 Nitro 记录资源元数据前转换已复制的公共资源，再在 Nitro 的 `compiled` 阶段转换服务端产物；每个输出目录只处理一次。配置、解析或一致性验证失败都会直接终止生产构建，并且不会写入部分转换产物。

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

混淆会直接处理 Nitro 的真实公共资源和服务端输出目录，并在转换后重新生成已有的预压缩资源。

### 方法 2：使用 CLI

1. 创建配置文件 `nuxt-css-obfuscator.config.js`：

```javascript
/** @type {import('nuxt-css-obfuscator').Options} */
module.exports = {
  enable: true,
  mode: 'random',
  refreshClassConversionJson: false,
  allowExtensions: ['.vue', '.js', '.ts', '.jsx', '.tsx', '.html', '.mjs', '.cjs', '.xml', '.xsl'],
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
| `removeOriginalCss` | `boolean` | `false` | `false` 保留原规则并追加混淆规则；`true` 在验证后只保留混淆规则 |
| `generatorSeed` | `number \| undefined` | `undefined` | 为 `random` 和 `simplify-seedable` 提供稳定种子 |
| `enableJsAst` | `boolean` | `true` | 结构化解析脚本；设为 `false` 时若脚本仍需替换则构建失败 |
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
  removeOriginalCss: false,
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

在 Nuxt 模块模式中，标记器会在 Vue 源码编译前处理静态类和可静态分析的 `:class`，并且只转换标记子树。`enableMarkers: true` 不能与 `removeOriginalCss: true` 同时使用，因为未标记内容仍依赖原始 CSS。

CLI 标记模式只支持结构可确定的静态 HTML、XML 和 XSL 产物。Nuxt SSR 或包含脚本的输出必须使用模块模式。

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

`--config` 支持 TypeScript、ESM 和 CommonJS。显式配置缺失或加载失败时会以非零状态退出。配置路径、构建目录、映射目录以及黑白名单中的相对路径都以 `--dir` 指定的项目根目录解析。

CLI 处理完整 Nitro 产物时，还会重新生成已有的 `.gz`/`.br` 文件并更新 Nitro 静态资源元数据。若任一已转换资源无法与清单保持一致，命令会失败，不会留下元数据错配的产物。

## 🤔 工作原理

1. **收集**：解析全部 CSS，并恢复已有转换映射
2. **暂存**：使用同一份类名、ID 和关键帧映射在内存中转换 CSS、JavaScript、SSR HTML、XML 与 XSL
3. **验证**：重新解析并检查暂存结果是否还有未转换的结构化引用
4. **写入**：仅在验证通过后替换产物并保存 `conversion.json`

与 PostCSS-Obfuscator 创建单独文件夹不同，此包直接编辑构建文件以确保与 Nuxt 的兼容性。

## 📝 许可证

MIT

## 🙏 致谢

灵感来自 [@soranoo](https://github.com/soranoo) 的 [next-css-obfuscator](https://github.com/soranoo/next-css-obfuscator)。
