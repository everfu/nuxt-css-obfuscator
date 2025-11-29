# 贡献指南 / Contributing Guide

感谢你对 nuxt-css-obfuscator 的关注！

## 📋 开发流程

### 1. Fork 和 Clone

```bash
# Fork 仓库后
git clone https://github.com/YOUR_USERNAME/nuxt-css-obfuscator.git
cd nuxt-css-obfuscator
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 开发

```bash
# 开发模式（监听文件变化）
pnpm run dev

# 运行测试
pnpm test

# 运行测试（单次）
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage
```

### 4. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能
git commit -m "feat: add new feature"

# 修复
git commit -m "fix: resolve bug"

# 文档
git commit -m "docs: update README"

# 重构
git commit -m "refactor: improve code structure"

# 测试
git commit -m "test: add unit tests"

# 构建
git commit -m "build: update dependencies"

# CI
git commit -m "ci: update workflow"

# 杂项
git commit -m "chore: update config"
```

### 5. 创建 Pull Request

1. 确保所有测试通过
2. 更新相关文档
3. 创建 PR 并描述你的更改

## 🚀 发布流程

### 自动发布（推荐）

当你更新 `package.json` 中的版本号并推送到 `main` 分支时，会自动触发发布流程：

```bash
# 使用 bumpp 交互式更新版本
pnpm run release
```

这会：
1. ✅ 提示选择版本类型（patch/minor/major）
2. ✅ 更新 `package.json` 中的版本
3. ✅ 创建 git commit 和 tag
4. ✅ 推送到 GitHub
5. ✅ 触发 GitHub Actions 自动：
   - 构建和测试项目
   - 创建 GitHub Release（包含自动生成的 Release Notes）
   - 发布到 npm
   - 使用 changelogithub 更新仓库中的 CHANGELOG.md

### 手动发布

如果需要手动发布：

```bash
# 1. 构建
pnpm run build

# 2. 运行测试
pnpm run test:run

# 3. 发布到 npm
pnpm publish
```

## 📝 版本规范

遵循 [Semantic Versioning](https://semver.org/)：

- **MAJOR** (1.0.0): 不兼容的 API 更改
- **MINOR** (0.1.0): 向后兼容的功能添加
- **PATCH** (0.0.1): 向后兼容的错误修复

## 🧪 测试要求

- 所有新功能必须包含测试
- 测试覆盖率应保持在 80% 以上
- 所有测试必须通过才能合并

## 📖 文档要求

- 新功能需要更新 README
- API 更改需要更新文档
- 重大更改需要更新 CHANGELOG

## 🔍 代码审查

所有 PR 都需要经过代码审查：

- 代码风格一致
- 测试充分
- 文档完整
- 无明显问题

## 🎯 开发建议

### 项目结构

```
src/
├── core/           # 核心功能
│   ├── css-parser.ts
│   ├── file-processor.ts
│   └── obfuscator.ts
├── utils/          # 工具函数
│   ├── config.ts
│   ├── generator.ts
│   └── logger.ts
├── types.ts        # 类型定义
├── module.ts       # Nuxt 模块
├── cli.ts          # CLI 工具
└── index.ts        # 入口文件
```

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用有意义的变量名
- 添加必要的注释

### 测试风格

```typescript
describe('FeatureName', () => {
  describe('SubFeature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## 🐛 报告问题

发现 bug？请创建 Issue 并包含：

- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（Node.js 版本、Nuxt 版本等）

## 💡 功能请求

有新想法？欢迎创建 Feature Request：

- 功能描述
- 使用场景
- 预期效果
- 可能的实现方案

## 📞 联系方式

- GitHub Issues: 提问和讨论
- Pull Requests: 贡献代码

## 🙏 感谢

感谢所有贡献者！

---

**Happy Coding!** 🎉
