# UI to Vue Converter

将 UI 设计图批量转换为 Vue 3 组件的 CLI 工具。

## 项目结构

```
src/
├── cli.js                    # CLI 入口 (Commander)
└── core/
    ├── scanner.js            # 扫描设计图目录，识别页面/状态
    ├── preset-config.js      # 预设配置系统（.ui-to-vue.config.json）
    ├── ui-library-adapter.js # UI 库适配器 (Vant/Element Plus/AntD Vue)
    ├── component-extractor.js # 公共组件提取器
    ├── code-generator.js     # Vue 代码生成器
    └── api-client.js         # 通义千问 VL API 客户端
```

## 核心流程

1. **Scanner** - 扫描 `--input` 目录，按目录/文件名分组识别页面和状态
2. **UiLibraryAdapter** - 加载 `--ui` 对应的 UI 库配置
3. **ComponentExtractor** - 分析公共组件（出现 2+ 次抽离）
4. **CodeGenerator** - 调用 API 生成 Vue 代码，注入导入，格式化，生成路由

## 常用命令

```bash
# 安装依赖
npm install

# 运行（需要 DASHSCOPE_API_KEY）
node src/cli.js --input ./screenshots --ui vant --output ./src

# 使用项目级配置（推荐）
node src/cli.js --input /path/to/designs --output /path/to/src --config /path/to/.ui-to-vue.config.json

# 测试
npm test
```

## 技术栈

- Node.js ES Module
- Commander (CLI)
- 通义千问 VL (qwen-vl-plus) 多模态 API
- Sharp (图片压缩)
- Prettier (代码格式化)
- fs-extra/glob (文件操作)

## API 密钥配置

优先级：传入参数 > `.ui-to-vue.config.json` > `DASHSCOPE_API_KEY` 环境变量

---

## ⚠️ 关键经验教训（修改代码前必读）

### 1. 目录结构识别规则

Scanner 按 **二级目录** 分组：

```
designs/module-a/list/xxx.png   → 模块=module-a, 页面=list
designs/module-a/detail/xxx.png → 模块=module-a, 页面=detail
```

**关键问题**：如果 `inputDir` 直接指向 `module-a/`（而非上级 `designs/`），则一级目录会被当成模块名，二级目录当成页面名，导致生成的文件名缺少 `module-a-` 前缀。

**正确做法**：`--input` 应该指向包含多个模块的上级目录，而不是某个模块内部。如果用户只想生成一个模块，应该临时确保该目录下只有这一个模块，或者增加 `--module` 参数支持。

### 2. 弹窗（Modal）vs 页面（Page）区分

设计图目录中的 `modal/` 子目录包含的是 **浮层对话框**，不是独立页面：

- 不应生成独立的 `.vue` 文件和路由
- 应提取弹窗的标题、内容、按钮文案
- 将 `dialog.confirm()` 调用注入到对应父页面（如 detail.vue）

弹窗识别特征：半透明遮罩 + 居中内容卡片 + "确定/取消"按钮。

### 3. 设计稿尺寸转换

常见设计图尺寸与实际输出：

| 设计图宽度 | 项目 rootValue | 转换规则 |
|-----------|---------------|---------|
| 375px | 75 (750标准) | 所有 px 值 × 2 |
| 750px | 75 (750标准) | 保持原值 |
| 375px | 37.5 (375标准) | 保持原值 |

Scanner 应自动读取图片 metadata 获取实际宽度，避免用户手动配置。

### 4. CSS 语法错误处理

AI 生成的大文件（如 detail.vue）可能出现 CSS 未闭合的情况（缺少 `}` 或 `</style>`），导致 Prettier 格式化失败。

CodeGenerator 应在格式化前做语法校验，自动补全未闭合的括号，而不是直接报 `Unexpected character "EOF"`。

### 5. 冗余 Import 清理

目标项目可能配置了 `unplugin-auto-import` 和 `VantResolver`，AI 仍可能生成：

```js
import { ref } from 'vue'
import { showToast, showDialog } from 'vant'
```

这些 import 应自动检测并删除（保留自定义导入如 `@/utils/toast`）。

---

## 📋 ROADMAP 使用方式

项目根目录有 `ROADMAP.md`，包含 10 个改进项，按 P0/P1/P2 分级。

**当用户要求修改 converter 时**：
1. 先读取 `ROADMAP.md` 了解整体规划
2. 询问用户要实施哪一项，或建议下一轮次
3. 按"实施建议"表格的顺序逐步推进，不要一次改太多

**当前推荐实施顺序**：
1. 第一轮：CSS 语法修复 + 冗余导入清理（风险低）
2. 第二轮：智能目录识别 + 尺寸自动识别
3. 第三轮：弹窗智能区分
4. 第四轮：增量生成 + 路由自动注入

---

## 🔧 代码修改规范

- 保持 ES Module 格式（`"type": "module"`）
- 新增模块放在 `src/core/` 下
- 在 `cli.js` 中注册新选项
- 修改后跑一遍完整生成流程验证（可用 test/ 目录下的测试用例）
- 不要修改 `package.json` 的 `"type": "module"` 配置
