import fs from 'fs-extra';
import path from 'path';

/**
 * Preset 配置系统
 *
 * 设计理念：工具源码只保留通用 default preset，
 * 项目特定配置通过 .ui-to-vue.config.json 外置。
 *
 * 配置文件支持两种模式：
 * 1. 引用内置 preset + 覆盖：{ "preset": "default", "useTypeScript": true }
 * 2. 完全自定义（不写 preset 字段）：直接写完整配置对象
 */

/**
 * 内置 toast 映射表
 * key: van | el | antd | custom | none
 */
const TOAST_PRESETS = {
  van: {
    import: "import { showToast, showSuccessToast, showFailToast } from 'vant'",
    info: 'showToast("{message}")',
    success: 'showSuccessToast("{message}")',
    error: 'showFailToast("{message}")'
  },
  el: {
    import: "import { ElMessage } from 'element-plus'",
    info: 'ElMessage({ message: "{message}", type: "info" })',
    success: 'ElMessage({ message: "{message}", type: "success" })',
    error: 'ElMessage({ message: "{message}", type: "error" })'
  },
  antd: {
    import: "import { message } from 'ant-design-vue'",
    info: 'message.info("{message}")',
    success: 'message.success("{message}")',
    error: 'message.error("{message}")'
  }
};

/**
 * 内置 confirm 映射表
 */
const CONFIRM_PRESETS = {
  van: {
    import: "import { showConfirmDialog } from 'vant'",
    call: 'showConfirmDialog({ title: "{title}", message: "{message}" })'
  },
  el: {
    import: "import { ElMessageBox } from 'element-plus'",
    call: 'ElMessageBox.confirm("{message}", "{title}")'
  },
  antd: {
    import: "import { Modal } from 'ant-design-vue'",
    call: 'Modal.confirm({ title: "{title}", content: "{message}" })'
  }
};

const PRESETS = {
  default: {
    name: 'default',
    description: '通用默认配置',
    useTypeScript: false,
    styleLang: 'css',
    useUnoCSS: true,
    designWidth: 375,
    projectStandardWidth: null,  // 项目设计标准宽度（如 750px），默认等于 designWidth
    rootValue: 37.5,
    layoutComponent: null,
    componentImportMode: 'full',
    fileNaming: 'pascal',
    outputStructure: 'nested',
    useBasePages: false,
    // toast / confirm 配置（新）
    // 可选值: van | el | antd | custom | none
    // 兼容旧配置: useToastUtil / useDialogUtil
    toast: 'van',
    confirm: 'van',
    customToastImport: '',
    customToastCall: '',
    customConfirmImport: '',
    customConfirmCall: '',
    customImports: [],
    customPromptRules: [],
    nameMap: {}
  }
};

export class PresetConfig {
  constructor(presetName = 'default', configPath = null) {
    this.presetName = presetName;

    // 1. 先加载外部配置文件（如果存在）
    const fileConfig = configPath
      ? this.loadConfigFile(configPath)
      : this.loadConfigFile();

    // 2. 确定使用哪个 preset 作为基础
    // 优先级：命令行 --preset > 配置文件的 preset 字段 > 'default'
    const effectivePreset = fileConfig.preset || presetName;
    const basePreset = PRESETS[effectivePreset] || PRESETS.default;

    // 3. 合并配置：内置 preset < 配置文件 < 环境变量
    this.config = {
      ...basePreset,
      ...fileConfig,
      // 环境变量最高优先级
      apiKey: process.env.UI_TO_VUE_API_KEY
        || process.env.DASHSCOPE_API_KEY
        || fileConfig.apiKey
        || null,
      provider: process.env.UI_TO_VUE_PROVIDER
        || fileConfig.provider
        || 'dashscope',
      model: process.env.UI_TO_VUE_MODEL
        || fileConfig.model
        || 'qwen3.6-plus'
    };

    // 4. 合并 nameMap（配置文件中的优先级更高）
    this.config.nameMap = {
      ...basePreset.nameMap,
      ...fileConfig.nameMap
    };

    // 5. 合并 customPromptRules
    const baseRules = basePreset.customPromptRules || [];
    const fileRules = fileConfig.customPromptRules || fileConfig.customPrompt || [];
    this.config.customPromptRules = [...baseRules, ...fileRules];

    // 6. 兼容旧配置 useToastUtil / useDialogUtil
    if (fileConfig.useToastUtil === true && !fileConfig.toast) {
      this.config.toast = 'custom';
      this.config.customToastImport = fileConfig.customToastImport || '';
      this.config.customToastCall = fileConfig.customToastCall || 'toast.show("{message}")';
    }
    if (fileConfig.useDialogUtil === true && !fileConfig.confirm) {
      this.config.confirm = 'custom';
      this.config.customConfirmImport = fileConfig.customConfirmImport || '';
      this.config.customConfirmCall = fileConfig.customConfirmCall || 'dialog.confirm("{title}", "{message}")';
    }
  }

  loadConfigFile(configPath = null) {
    const paths = configPath
      ? [configPath]
      : [
          path.join(process.cwd(), 'ui-to-vue.config.json'),
          path.join(process.cwd(), '.ui-to-vue.config.json')
        ];

    for (const p of paths) {
      if (fs.existsSync(p)) {
        try {
          return fs.readJSONSync(p);
        } catch (e) {
          console.warn(`⚠️ 配置文件读取失败: ${p}`);
        }
      }
    }
    return {};
  }

  get() {
    return this.config;
  }

  getPromptRules() {
    return this.config.customPromptRules || [];
  }

  getDesignWidth() {
    return this.config.designWidth || 375;
  }

  getFileName(name) {
    if (this.config.fileNaming === 'kebab') {
      return this.toKebabCase(name) + '.vue';
    }
    return this.toPascalCase(name) + '.vue';
  }

  getScriptTag() {
    return this.config.useTypeScript
      ? '<script setup lang="ts">'
      : '<script setup>';
  }

  getStyleTag() {
    const scoped = 'scoped';
    const lang = this.config.styleLang || 'css';
    if (lang === 'css') {
      return `<style ${scoped}>`;
    }
    return `<style ${scoped} lang="${lang}">`;
  }

  toPascalCase(str) {
    return str.replace(/(^|[-_/\. ])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/[-_/\. ]/g, '');
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  static listPresets() {
    return Object.keys(PRESETS).map(key => ({
      name: key,
      description: PRESETS[key].description
    }));
  }

  /**
   * 获取 toast 的 prompt 提示文本
   * @returns {string|null}
   */
  getToastPrompt() {
    const cfg = this.config;
    const type = cfg.toast;
    if (!type || type === 'none') return null;

    if (type === 'custom') {
      if (!cfg.customToastCall) return null;
      const importLine = cfg.customToastImport ? `，import：\`${cfg.customToastImport}\`` : '';
      return `- toast 使用 \`${cfg.customToastCall.replace('{message}', '消息')}\`${importLine}`;
    }

    const preset = TOAST_PRESETS[type];
    if (!preset) return null;
    return `- toast 使用 \`${preset.info.replace('{message}', '消息')}\`，import：\`${preset.import}\``;
  }

  /**
   * 获取 confirm 的 prompt 提示文本
   * @returns {string|null}
   */
  getConfirmPrompt() {
    const cfg = this.config;
    const type = cfg.confirm;
    if (!type || type === 'none') return null;

    if (type === 'custom') {
      if (!cfg.customConfirmCall) return null;
      const importLine = cfg.customConfirmImport ? `，import：\`${cfg.customConfirmImport}\`` : '';
      return `- confirm/dialog 使用 \`${cfg.customConfirmCall.replace('{title}', '标题').replace('{message}', '内容')}\`${importLine}`;
    }

    const preset = CONFIRM_PRESETS[type];
    if (!preset) return null;
    return `- confirm/dialog 使用 \`${preset.call.replace('{title}', '标题').replace('{message}', '内容')}\`，import：\`${preset.import}\``;
  }
}
