# 安装和使用说明

## 安装

### 1. 安装依赖
```bash
cd ui-to-vue-converter
npm install
```

### 2. 配置环境变量
```bash
export DASHSCOPE_API_KEY=your_aliyun_dashscope_api_key
```
API密钥可以在阿里云DashScope控制台获取：https://dashscope.console.aliyun.com/

### 3. 全局安装（可选）
```bash
npm link
```
安装后可以在任意目录使用 `ui-to-vue` 命令。

## 使用方法

### 基本使用
```bash
ui-to-vue --input ./screenshots --ui vant --output ./src
```

### 生成PC端Element Plus代码
```bash
ui-to-vue --input ./pc-screenshots --ui element-plus --output ./src
```

### 生成PC端Ant Design Vue代码
```bash
ui-to-vue --input ./pc-screenshots --ui antd-vue --output ./src
```

### 绝对路径示例
```bash
ui-to-vue --input /Users/your-username/designs --output /Users/your-username/project/src
```

### 使用配置文件
```bash
ui-to-vue --config ./.ui-to-vue.config.json
```

## 集成到Claude Code / OpenClaw
1. 将整个技能目录复制到 `~/.claude/skills/learned/ui-to-vue/`
2. 重启Claude Code即可自动加载
3. 使用时执行命令：`/skill ui-to-vue --input ./screenshots --ui vant --output ./src`

## 最佳实践
- 设计图按页面分组存放，同一页面的不同状态放在同一个子目录下
- 文件名尽量清晰，包含页面名称和状态信息，如 `user-list.png`、`user-detail.png`
- 优先使用UI库原生组件，减少自定义样式开发
- 生成的代码建议进行少量调整以适配实际业务逻辑
