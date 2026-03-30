# `packages/nuxt` 文档设计

## 背景

本次工作目标是在 `packages/nuxt` 下新增两个中文文档：

- `README.md`
- `OVERVIEW.md`

这两个文件是包级文档，不是仓库级文档。它们需要与仓库根目录现有文档分工保持一致，同时覆盖 `@heyintech/sdkr-nuxt` 这个包当前已实现的能力和实现边界。

## 设计目标

本次文档设计要满足以下目标：

1. 让第一次接触 `@heyintech/sdkr-nuxt` 的 Nuxt 使用者，可以仅通过 `packages/nuxt/README.md` 完成安装、配置和标准示例接入。
2. 让维护者、贡献者或高级使用者，可以通过 `packages/nuxt/OVERVIEW.md` 快速理解模块 setup、collection 解析、路由扫描、类型生成和 transform 的实现链路。
3. 避免包级文档和仓库根 `README.md` / `OVERVIEW.md` 互相复制，只保留必要的一致表述和适度的交叉引用。
4. 在文档里统一使用当前 `packages/nuxt/package.json` 中声明的包名 `@heyintech/sdkr-nuxt`。

## 读者与分工

### `packages/nuxt/README.md`

目标读者：

- 第一次安装该包的 Nuxt 使用者
- 需要查阅配置、collection 约定、`CallaMeta` 用法的开发者

职责：

- 解释这个包是什么
- 给出安装与启用方式
- 给出一个标准示例
- 说明 `sdkr.collections` 的几种主要写法
- 说明 collection 定义约定
- 说明 `CallaMeta` 与 `calla(...)` 的使用边界
- 列出公开配置项
- 在结尾为维护者提供进一步阅读入口

### `packages/nuxt/OVERVIEW.md`

目标读者：

- 维护者
- 贡献者
- 需要理解内部机制的高级使用者

职责：

- 说明当前实现模型
- 说明模块 setup 的完整链路
- 说明 collection 引用解析规则
- 说明路由扫描和冲突判定
- 说明 `CallaMeta` 提取与模板生成
- 说明 `calla` 类型壳和 transform 的职责边界
- 说明 playground / 测试目前覆盖的验证面

## 内容边界

### README 应包含

- 一句话定位
- 核心特性概览
- 安装命令
- `nuxt.config.ts` 的最小启用示例
- 一个标准示例：
  - `collection.ts`
  - `nuxt.config.ts` 中的 `sdkr.collections`
  - 一个导出 `CallaMeta` 的 handler
  - 一个 `calla(...)` 调用示例
- `sdkr.collections` 的三类主要写法：
  - 目录式
  - 显式 `.ts` 文件式
  - glob
- `defineApiCollection(...)`、`root`、`routeGroups`、`ignore` 的说明
- `CallaMeta` 只读取 `body` / `query` / `res`
- `injectCallaToGlobal` 的用法和显式导入 `#sdkr/calla`
- 面向维护者的入口说明，链接到 `./OVERVIEW.md`

### README 不应包含

- 模块 setup 的逐步内部执行链路
- AST 解析细节
- transform 的作用域跟踪实现细节
- 测试和 playground 的内部验证路径

### OVERVIEW 应包含

- 这个包解决的问题
- 当前实现模型的两个关键边界：
  - `calla(...)` 是编译期宏表面
  - `defineApiCollection(...)` 是 authoring helper
- `src/module.ts` 中的 setup 流程
- `src/collection-ref.ts` 的解析规则
- `src/collection.ts` 的用户侧契约
- `src/scan.ts` 的扫描规则与文件名映射规则
- `src/module.ts` 中的冲突判定规则
- `src/calla-meta.ts` 与 `src/templates.ts` 的类型链路
- `src/calla.ts` 的类型壳定位
- `src/transform.ts` 中两套 transform 逻辑的分工
- 当前 playground 与测试覆盖的主要场景

### OVERVIEW 不应包含

- 安装步骤
- 完整快速开始教程
- 与 README 重复的配置大段示例

## 文案与语言规范

1. 两个文件都先写中文。
2. 术语尽量与现有根级中文概览保持一致，例如：
   - collection
   - handler
   - 类型生成
   - 编译期宏表面
   - authoring helper
3. 示例和说明以准确为先，不为了“中文化”而改掉代码中的真实符号名。
4. 语气保持直接、技术说明式，不写营销型措辞。

## 章节设计

### `packages/nuxt/README.md`

计划章节：

1. `@heyintech/sdkr-nuxt 是什么`
2. 功能概览
3. 安装与启用
4. 快速开始
5. `sdkr.collections` 的写法
6. collection 定义约定
7. `CallaMeta` 与 `calla(...)`
8. 常用选项
9. 给维护者与贡献者

### `packages/nuxt/OVERVIEW.md`

计划章节：

1. 这个包解决什么问题
2. 当前实现模型
3. 模块启动流程
4. collection 引用解析
5. collection 契约
6. 路由扫描与冲突判定
7. 类型提取与模板生成
8. `calla` 类型接口
9. transform 层
10. playground 与测试覆盖

## 示例与事实来源

文档内容需要以当前代码为准，主要事实来源包括：

- `packages/nuxt/package.json`
- `packages/nuxt/src/module.ts`
- `packages/nuxt/src/collection.ts`
- `packages/nuxt/src/collection-ref.ts`
- `packages/nuxt/src/scan.ts`
- `packages/nuxt/src/calla.ts`
- `packages/nuxt/src/calla-meta.ts`
- `packages/nuxt/src/templates.ts`
- `packages/nuxt/src/transform.ts`
- `packages/nuxt/playground/*`
- `packages/nuxt/test/*`

文档必须反映以下已确认事实：

- 安装包名使用 `@heyintech/sdkr-nuxt`
- `peerDependencies.nuxt` 当前是 `^4.0.0`
- `injectCallaToGlobal` 默认值为 `true`
- `sdkr.collections` 相对消费方 Nuxt 项目的 `rootDir` 解析
- 非显式 TypeScript 文件路径会自动补 `/collection.ts`
- `CallaMeta` 仅提取 `body` / `query` / `res`

## 实现范围

本次实现只创建或更新以下文件：

- `packages/nuxt/README.md`
- `packages/nuxt/OVERVIEW.md`

不在本次范围内：

- 修改源码实现
- 修改测试
- 调整包名、导出面或运行时行为
- 补英文版包级文档

## 验收标准

交付后的结果应满足：

1. `packages/nuxt/README.md` 可以单独指导使用者完成标准接入。
2. `packages/nuxt/OVERVIEW.md` 可以单独解释维护者需要的核心实现链路。
3. 两份文档之间的重复控制在必要术语和少量交叉引用范围内。
4. 文档中的配置项、路径规则、默认值和导入方式与当前代码一致。
5. `README.md` 末尾明确引导维护者继续阅读 `OVERVIEW.md`。
