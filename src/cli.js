import { Command } from 'commander';
import { Scanner } from './core/scanner.js';
import { CodeGenerator } from './core/code-generator.js';
import { UiLibraryAdapter } from './core/ui-library-adapter.js';
import { ComponentExtractor } from './core/component-extractor.js';

const program = new Command();

program
  .name('ui-to-vue')
  .description('UI设计图批量转Vue组件工具')
  .version('1.0.0')
  .option('--input <path>', '设计图目录路径', './screenshots')
  .option('--ui <library>', 'UI库选择: vant/element-plus/antd-vue', 'vant')
  .option('--output <path>', '输出目录', './src')
  .option('--config <path>', '配置文件路径')
  .action(async (options) => {
    console.log('🚀 开始生成Vue组件...');
    console.log(`📁 设计图目录: ${options.input}`);
    console.log(`🎨 UI库: ${options.ui}`);
    console.log(`📤 输出目录: ${options.output}`);

    // 1. 扫描设计图目录
    const scanner = new Scanner(options.input);
    const pageGroups = await scanner.scan();
    console.log(`✅ 识别到 ${pageGroups.length} 个页面组`);

    // 2. UI库适配
    const uiAdapter = new UiLibraryAdapter(options.ui);
    const uiConfig = uiAdapter.getConfig();
    console.log(`✅ 加载${uiConfig.name} UI库配置`);

    // 3. 分析公共组件
    const componentExtractor = new ComponentExtractor(pageGroups, uiConfig);
    const commonComponents = await componentExtractor.analyze();
    console.log(`✅ 识别到 ${commonComponents.length} 个公共组件`);

    // 4. 生成代码
    const generator = new CodeGenerator({
      outputDir: options.output,
      uiConfig,
      commonComponents
    });
    await generator.generate(pageGroups);
    console.log('🎉 代码生成完成！');
  });

program.parse();
