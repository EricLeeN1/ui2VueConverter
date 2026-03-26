---
name: ui-to-vue
description: UI设计图批量转Vue组件，支持Vant/Element Plus/Ant Design Vue多UI库
origin: community
---

# UI 转 Vue 组件技能

将UI设计图（蓝湖、Figma截图）批量转换为Vue 3组件的技能。

## When to Use
- 需要将大量设计稿快速转换为可运行的Vue代码时
- 需要统一使用指定UI库开发项目初始化阶段
- 需要自动抽离公共组件，提升代码复用率

## Core Concepts
1. **页面分组**：自动识别同一页面的不同状态（列表、详情、表单、弹窗等）
2. **UI库适配**：自动映射原生HTML元素到对应UI库组件
3. **组件抽取**：分析所有页面结构，自动识别重复元素并抽离为公共组件
4. **代码生成**：调用Qwen VL多模态模型分析设计图生成代码

## Code Examples
```bash
# 生成移动端Vant组件
/skill ui-to-vue --input ./screenshots --ui vant --output ./src

# 生成PC端Element Plus组件
/skill ui-to-vue --input ./pc-designs --ui element-plus --output ./src/pages

# 生成PC端Ant Design Vue组件
/skill ui-to-vue --input ./pc-designs --ui antd-vue --output ./src/pages
```

## Best Practices
- 设计图按页面分组存放，同一页面不同状态放在同一目录下
- 文件名清晰标识页面状态，如`list-default.png`/`list-detail.png`
- 优先使用支持的UI库组件，避免不必要的自定义样式

## Checklist
使用技能后请验证以下内容：
- [ ] 所有页面组件已生成到 `output/views/` 目录
- [ ] 识别到的公共组件已生成到 `output/components/` 目录
- [ ] 路由配置文件已自动生成到 `output/router/index.js`
- [ ] 生成的Vue代码使用了指定UI库的组件
- [ ] 代码无明显语法错误，可以正常格式化
- [ ] 页面所有状态都通过条件渲染整合在同一个组件中
