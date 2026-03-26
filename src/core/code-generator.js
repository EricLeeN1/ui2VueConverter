import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import { ApiClient } from './api-client.js';

export class CodeGenerator {
  constructor(options) {
    this.outputDir = options.outputDir;
    this.uiConfig = options.uiConfig;
    this.commonComponents = options.commonComponents;
    this.apiClient = new ApiClient();
  }

  async generate(pageGroups) {
    // 创建输出目录结构
    await fs.ensureDir(path.join(this.outputDir, 'views'));
    await fs.ensureDir(path.join(this.outputDir, 'components'));
    await fs.ensureDir(path.join(this.outputDir, 'router'));

    // 生成公共组件
    await this.generateCommonComponents();

    // 生成页面组件
    const routes = [];
    for (const page of pageGroups) {
      console.log(`正在生成页面: ${page.name}`);

      // 调用AI API生成代码
      let code = await this.apiClient.generateVueCode(page, this.uiConfig);

      // 注入UI库和公共组件导入
      code = this.injectImports(code);

      // 格式化代码
      code = await prettier.format(code, {
        parser: 'vue',
        semi: false,
        singleQuote: true,
        trailingComma: 'none'
      });

      // 保存文件
      const outputPath = path.join(this.outputDir, 'views', page.componentName);
      await fs.writeFile(outputPath, code, 'utf8');

      // 生成路由配置
      const routePath = `/${page.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      routes.push({
        path: routePath,
        name: page.name,
        component: `() => import('@/views/${page.componentName}')`,
        meta: { title: page.name }
      });
    }

    // 生成路由文件
    await this.generateRouterFile(routes);
  }

  async generateCommonComponents() {
    for (const component of this.commonComponents) {
      const template = this.getComponentTemplate(component);
      const outputPath = path.join(this.outputDir, 'components', component.fileName);
      await fs.writeFile(outputPath, template, 'utf8');
    }
  }

  getComponentTemplate(component) {
    return `<script setup>
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

<style scoped>
/* 组件样式 */
.${component.name.toLowerCase()} {
}
</style>
`;
  }

  injectImports(code) {
    let importStatements = '';

    // 添加UI库导入
    importStatements += `${this.uiConfig.import}\n`;

    // 添加公共组件导入
    if (this.commonComponents.length > 0) {
      importStatements += this.commonComponents.map(comp =>
        `import ${comp.name} from '@/components/${comp.fileName}'`
      ).join('\n') + '\n';
    }

    // 注入到script setup开头
    return code.replace('<script setup>', `<script setup>
${importStatements}`);
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
