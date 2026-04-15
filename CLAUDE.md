# UI to Vue Converter

将 UI 设计图批量转换为 Vue 3 组件的 CLI 工具。

## 项目结构

```
src/
├── cli.js                    # CLI 入口 (Commander)
└── core/
    ├── scanner.js            # 扫描设计图目录，识别页面/状态
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