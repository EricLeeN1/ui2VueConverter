#!/usr/bin/env node
import { Command } from 'commander';
import { Scanner } from './core/scanner.js';
import { CodeGenerator } from './core/code-generator.js';
import { UiLibraryAdapter } from './core/ui-library-adapter.js';
import { ComponentExtractor } from './core/component-extractor.js';
import { PresetConfig } from './core/preset-config.js';

const program = new Command();

program
  .name('ui-to-vue')
  .description('UI设计图批量转Vue组件工具')
  .version('1.0.5')
  .option('--input <path>', '设计图目录路径', './screenshots')
  .option('--ui <library>', 'UI库选择: vant/element-plus/antd-vue', 'vant')
  .option('--output <path>', '输出目录', './src')
  .option('--config <path>', '配置文件路径')
  .option('--preset <name>', '配置预设: default/gtzw-h5', 'default')
  .option('--inject-router <path>', '自动注入路由到项目路由文件（如 src/router/index.ts）')
  .action(async (options) => {
    console.log('🚀 开始生成Vue组件...');
    console.log(`📁 设计图目录: ${options.input}`);
    console.log(`🎨 UI库: ${options.ui}`);
    console.log(`📤 输出目录: ${options.output}`);
    console.log(`⚙️ 配置预设: ${options.preset}`);
    if (options.injectRouter) {
      console.log(`🔗 路由注入: ${options.injectRouter}`);
    }

    // 0. 加载 Preset 配置
    const presetConfig = new PresetConfig(options.preset, options.config);
    const preset = presetConfig.get();
    console.log(`✅ 加载预设配置: ${preset.name}`);

    // 1. 扫描设计图目录
    const scanner = new Scanner(options.input, presetConfig);
    const pageGroups = await scanner.scan();
    console.log(`✅ 识别到 ${pageGroups.length} 个页面组`);

    // 显示切图统计
    const totalCutImages = pageGroups.reduce((sum, p) => sum + (p.cutImages?.length || 0), 0);
    if (totalCutImages > 0) {
      console.log(`✅ 识别到 ${totalCutImages} 个设计切图/素材`);
    }

    // 2. UI库适配
    const uiAdapter = new UiLibraryAdapter(options.ui);
    const uiConfig = uiAdapter.getConfig();
    // 用 preset 覆盖 UI 配置中的设计稿宽度
    uiConfig.designWidth = preset.designWidth || uiConfig.designWidth;
    uiConfig.rootValue = preset.rootValue || uiConfig.rootValue;
    console.log(`✅ 加载${uiConfig.name} UI库配置`);

    // 3. 分析公共组件
    const componentExtractor = new ComponentExtractor(pageGroups, uiConfig);
    const commonComponents = await componentExtractor.analyze();
    console.log(`✅ 识别到 ${commonComponents.length} 个公共组件`);

    // 4. 生成代码
    const generator = new CodeGenerator({
      outputDir: options.output,
      uiConfig,
      commonComponents,
      presetConfig
    });
    await generator.generate(pageGroups, options.injectRouter);
    console.log('🎉 代码生成完成！');
  });

program.parse();
