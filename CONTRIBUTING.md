# 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 贡献方式

### 报告问题
- 请在Issue中详细描述问题的复现步骤
- 附上运行环境（Node版本、操作系统等）
- 如果是生成代码的问题，请附上设计图示例和错误日志

### 新增功能
- 新增UI库支持：在 `src/core/ui-library-adapter.js` 中添加对应配置
- 优化代码生成效果：调整prompt模板或后处理逻辑
- 修复bug：请确保修复后所有测试用例可以正常运行

### 代码规范
- 使用ESLint默认规范
- 提交信息遵循Conventional Commits格式：`feat: xxx` / `fix: xxx` / `docs: xxx`
- 新增功能请添加对应的测试用例

## 开发流程
1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交修改：`git commit -am 'feat: add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交Pull Request
