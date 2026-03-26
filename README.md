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
- ✅ 生成符合规范的Vue 3 Composition API代码
- ✅ 自动生成路由配置
- ✅ 生成代码自动格式化

## 快速开始

### 方式一：从GitHub克隆
```bash
# 克隆项目
git clone https://github.com/EricLeeN1/ui2VueConverter.git
cd ui-to-vue-converter

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

## 📄 License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！详见 [CONTRIBUTING.md](CONTRIBUTING.md) 贡献指南

## ⭐ 支持

如果这个项目对你有帮助，欢迎点个Star支持一下！

---

**本项目与阿里巴巴/通义千问无官方关联，仅使用其公开API服务。**

