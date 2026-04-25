import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import { ApiClient } from './api-client.js';

export class CodeGenerator {
  constructor(options) {
    this.outputDir = options.outputDir;
    this.uiConfig = options.uiConfig;
    this.commonComponents = options.commonComponents;
    this.presetConfig = options.presetConfig;
    this.preset = this.presetConfig.get();
    this.apiClient = new ApiClient(null, this.presetConfig);
  }

  async generate(pageGroups) {
    // 输出结构：flat 模式不创建 views/ 子目录，nested 模式创建
    const viewsDir = this.preset.outputStructure === 'flat'
      ? this.outputDir
      : path.join(this.outputDir, 'views');
    await fs.ensureDir(viewsDir);

    // 只在 nested 模式下创建 components 和 router
    if (this.preset.outputStructure !== 'flat') {
      await fs.ensureDir(path.join(this.outputDir, 'components'));
      await fs.ensureDir(path.join(this.outputDir, 'router'));
    }

    // 生成公共组件（只在 nested 模式）
    if (this.preset.outputStructure !== 'flat') {
      await this.generateCommonComponents();
    }

    // 生成页面组件
    const routes = [];
    for (const page of pageGroups) {
      console.log(`正在生成页面: ${page.name}`);

      // 调用AI API生成代码
      let code = await this.apiClient.generateVueCode(page, this.uiConfig);

      // 注入导入
      code = this.injectImports(code);

      // 调整 script/style 标签
      code = this.adjustTags(code);

      // 格式化代码（出错时跳过）
      try {
        code = await prettier.format(code, {
          parser: 'vue',
          semi: false,
          singleQuote: true,
          trailingComma: 'none'
        });
      } catch (fmtErr) {
        console.warn(`⚠️ 格式化失败，保存原始代码: ${fmtErr.message}`);
      }

      // 保存文件（使用 preset 的命名规则）
      const fileName = this.presetConfig.getFileName(page.name);
      const outputPath = path.join(viewsDir, fileName);
      await fs.writeFile(outputPath, code, 'utf8');

      // 收集路由信息
      routes.push({
        path: page.routePath || `/${this.presetConfig.toKebabCase(page.name)}`,
        name: this.presetConfig.toPascalCase(page.name),
        component: fileName,
        meta: { title: page.name }
      });
    }

    // 只在 nested 模式下生成独立路由文件
    if (this.preset.outputStructure !== 'flat') {
      await this.generateRouterFile(routes);
    }

    // 打印路由信息供用户手动注册
    if (routes.length > 0) {
      console.log('\n📋 生成的路由信息（请手动注册到项目路由文件）：');
      for (const route of routes) {
        console.log(`  { path: '${route.path}', name: '${route.name}', component: () => import('@/views/${route.component}') }`);
      }
    }
  }

  async generateCommonComponents() {
    for (const component of this.commonComponents) {
      const template = this.getComponentTemplate(component);
      const outputPath = path.join(this.outputDir, 'components', component.fileName);
      await fs.writeFile(outputPath, template, 'utf8');
    }
  }

  getComponentTemplate(component) {
    const scriptTag = this.presetConfig.getScriptTag();
    const styleTag = this.presetConfig.getStyleTag();

    return `${scriptTag}
// ${component.name} 公共组件
const props = defineProps({
  // 组件属性定义
})

const emit = defineEmits([])
</script>

<template>
  <div class="${component.name.toLowerCase()}">
    <!-- 组件内容 -->
    <slot />
  </div>
</template>

${styleTag}
/* 组件样式 */
.${component.name.toLowerCase()} {
}
</style>
`;
  }

  injectImports(code) {
    const imports = [];

    // 自定义导入（如 toast、dialog）
    if (this.preset.customImports && this.preset.customImports.length > 0) {
      imports.push(...this.preset.customImports);
    }

    // 公共组件导入
    if (this.commonComponents.length > 0 && this.preset.outputStructure !== 'flat') {
      for (const comp of this.commonComponents) {
        imports.push(`import ${comp.name} from '@/components/${comp.fileName}'`);
      }
    }

    if (imports.length === 0) return code;

    const importBlock = imports.join('\n') + '\n';

    // 注入到 script setup 开头
    const scriptRegex = /(<script setup(?:\s+lang="ts")?>)/;
    return code.replace(scriptRegex, `$1\n${importBlock}`);
  }

  adjustTags(code) {
    // 替换 script setup 标签
    const scriptTag = this.presetConfig.getScriptTag();
    code = code.replace(/<script setup>/, scriptTag);
    code = code.replace(/<script setup lang="ts">/, scriptTag);

    // 替换 style scoped 标签
    const styleTag = this.presetConfig.getStyleTag();
    code = code.replace(/<style scoped>/, styleTag);
    code = code.replace(/<style scoped lang="scss">/, styleTag);
    code = code.replace(/<style scoped lang="css">/, styleTag);

    return code;
  }

  async generateRouterFile(routes) {
    const routerTemplate = `import { createRouter, createWebHistory } from 'vue-router'

const routes = [
${routes.map(route => `  {
    path: '${route.path}',
    name: '${route.name}',
    component: ${route.component},
    meta: ${JSON.stringify(route.meta)}
  }`).join(',\n')}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
`;

    const formattedCode = await prettier.format(routerTemplate, {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      trailingComma: 'none'
    });

    await fs.writeFile(path.join(this.outputDir, 'router', 'index.js'), formattedCode, 'utf8');
  }
}
