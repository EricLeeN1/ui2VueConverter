# UI 设计图转 Vue 组件工具

[![GitHub license](https://img.shields.io/github/license/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/EricLeeN1/ui2VueConverter)](https://github.com/EricLeeN1/ui2VueConverter/issues)
[![npm version](https://img.shields.io/npm/v/ui-to-vue-converter)](https://www.npmjs.com/package/ui-to-vue-converter)

一键将UI设计图（蓝湖、Figma等截图）批量转换为Vue 3组件，支持多UI库，自动抽离公共组件，可作为Claude Code/OpenClaw/Trace技能使用。

## 功能特性

- ✅ 批量扫描设计图目录，自动识别页面和页面的不同状态
- ✅ 支持选择UI库：移动端Vant、PC端Element Plus、Ant Design Vue
- ✅ 自动识别并抽离公共组件，减少重复代码
- ✅ **支持设计切图/素材，生成更精准的UI还原**
- ✅ 生成符合规范的Vue 3 Composition API代码
- ✅ 自动生成路由配置
- ✅ 生成代码自动格式化

## 快速开始

### 方式一：从GitHub克隆
```bash
# 克隆项目
git clone https://github.com/EricLeeN1/ui2VueConverter.git
cd ui2VueConverter

# 安装依赖
npm install

# 配置API密钥
export DASHSCOPE_API_KEY=your_api_key

# 生成代码
node src/cli.js --input ./screenshots --ui vant --output ./src
```

### 方式二：全局安装
```bash
npm install -g ui-to-vue-converter

# 配置API密钥
export DASHSCOPE_API_KEY=your_api_key

# 生成代码
ui-to-vue --input ./screenshots --ui vant --output ./src
```

## 参数说明

- `--input`: 设计图目录路径，默认`./screenshots`
- `--ui`: UI库选择，支持`vant`/`element-plus`/`antd-vue`，默认`vant`
- `--output`: 输出目录，默认`./src`
- `--config`: 配置文件路径，默认`./.ui-to-vue.config.json`

## 路径模式说明
所有路径参数**同时支持相对路径和绝对路径**：
- **相对路径**：相对于执行命令时的当前工作目录（CWD）
- **绝对路径**：直接使用传入的完整路径，不做转换

### 示例
```bash
# 相对路径（推荐，在项目根目录执行）
ui-to-vue --input ./designs --output ./src

# 绝对路径
ui-to-vue --input /Users/your-username/common-designs --output /Users/your-username/project/src
```

## 🖼️ 设计切图/素材支持

为了提高生成代码的UI还原度，本工具支持识别设计切图（图标、按钮、标签等独立元素），并将切图素材传给AI模型分析，使生成的代码更精准地还原图标样式、颜色和尺寸。

### 为什么需要切图？

| 有切图 | 无切图 |
|--------|--------|
| 图标/按钮样式准确 | 可能使用默认组件图标 |
| 颜色值更精确 | 颜色可能不够准确 |
| 间距/尺寸更准确 | 尺寸可能偏差 |
| 自定义元素还原度高 | 自定义元素可能被误解 |

### 切图目录结构

工具支持**三级切图目录**，优先级从高到低：

| 层级 | 目录结构 | 适用场景 |
|------|---------|---------|
| 页面级 | `模块/页面类型/切图/` | 仅某个页面使用的切图 |
| 模块级 | `模块/切图/` | 该模块所有页面共用的切图 |
| 全局级 | `切图/` | 所有模块共用的切图 |

```
screenshots/
├── 签收登记/                      # 业务模块
│   ├── 列表/                      # 页面类型（二级目录）
│   │   ├── 签收登记-列表-待签收@3x.png  # 页面截图
│   │   ├── 签收登记-列表-已签收@3x.png
│   │   └── 切图/                  # 页面级切图 ⭐⭐⭐
│   │       ├── btn-refresh.png    # 列表页专属刷新按钮
│   │       ├── icon-status.png    # 列表状态图标
│   │       └── ...
│   │
│   ├── 详情/                      # 另一个页面类型
│   │   ├── 签收登记-详情@3x.png
│   │   ├── 切图/                  # 详情页专属切图
│   │   │   ├── btn-approve.png    # 详情页审批按钮
│   │   │   └── ...
│   │
│   ├── 切图/                      # 模块级切图 ⭐⭐
│   │   ├── icon-back.png          # 返回箭头（模块通用）
│   │   ├── icon-search.png        # 搜索图标（模块通用）
│   │   └── ...
│   │
│   ├── 签收登记-待签收@3x.png      # 一级目录结构（兼容）
│   ├── 签收登记-详情@3x.png
│   └── 签收登记-已签收@3x.png
│
├── 收文办理/
│   ├── 列表/
│   │   ├── 收文办理-列表@3x.png
│   │   └── 切图/
│   │       └── ...
│   ├── 切图/
│   │   └── ...
│
├── 切图/                          # 全局切图 ⭐
│   ├── logo.png                   # Logo（所有模块共用）
│   ├── icon-home.png              # 首页图标
│   ├── icon-user.png              # 用户图标
│   ├── avatar-default.png         # 默认头像
│   └── ...
│
└── index.html                     # 预览页面（可选）
```

**切图查找优先级**：页面级 > 模块级 > 全局级

同名切图在不同层级存在时，优先使用页面级的切图，确保每个页面能使用最合适的素材。

### 切图命名建议

为了更好地识别切图类型，建议使用以下命名规范：

| 前缀 | 类型 | 示例 |
|------|------|------|
| `icon-` | 图标 | `icon-back.png`, `icon-search.png` |
| `btn-` / `button-` | 按钮 | `btn-primary.png`, `btn-submit.png` |
| `logo` | Logo | `logo.png`, `logo-dark.png` |
| `tab-` | 标签页 | `tab-active.png`, `tab-inactive.png` |
| `badge-` | 徽章 | `badge-new.png`, `badge-count.png` |
| `tag-` | 标记 | `tag-urgent.png`, `tag-status.png` |
| `arrow-` | 箭头 | `arrow-left.png`, `arrow-right.png` |
| `bg-` | 背景 | `bg-header.png`, `bg-card.png` |
| `avatar-` | 头像 | `avatar-default.png`, `avatar-small.png` |

### 支持的切图目录名称

工具会自动识别以下目录作为切图目录：
- `切图` (中文)
- `assets`
- `icons`
- `sprites`
- `cut`
- `images`

### 切图格式支持

- PNG（推荐）
- JPG/JPEG
- SVG

### 使用切图的生成效果

```bash
# 运行生成命令，工具会自动识别切图目录
node src/cli.js --input ./screenshots --ui vant --output ./src

# 输出示例：
# ✅ 识别到 5 个页面组
# ✅ 识别到 12 个设计切图/素材  ← 切图已被识别
# ✅ 加载Vant UI库配置
# 正在生成页面: 签收登记
```

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！详见 [CONTRIBUTING.md](CONTRIBUTING.md) 贡献指南

## ⭐ 支持

如果这个项目对你有帮助，欢迎点个Star支持一下！

---

**本项目与阿里巴巴/通义千问无官方关联，仅使用其公开API服务。**