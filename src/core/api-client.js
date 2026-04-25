import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';

const CLAUDE_API_URL = 'https://coding.dashscope.aliyuncs.com/apps/anthropic/v1/messages';

export class ApiClient {
  constructor(apiKey = null, presetConfig = null) {
    this.preset = presetConfig || { get: () => ({}), getPromptRules: () => [] };
    const config = this.preset.get();

    // API Key 优先级：传入 > 配置 > 环境变量
    this.apiKey = apiKey
      || config.apiKey
      || process.env.UI_TO_VUE_API_KEY
      || process.env.DASHSCOPE_API_KEY;

    if (!this.apiKey) {
      throw new Error(
        '未配置 API Key，请通过以下方式设置：\n' +
        '1. 配置文件 .ui-to-vue.config.json 的 apiKey 字段\n' +
        '2. 环境变量 UI_TO_VUE_API_KEY（推荐）\n' +
        '3. 兼容旧版环境变量 DASHSCOPE_API_KEY'
      );
    }

    this.provider = config.provider || 'dashscope';
    this.model = config.model || 'qwen3.6-plus';
  }

  async generateVueCode(pageGroup, uiConfig) {
    const presetCfg = this.preset.get();
    const designWidth = presetCfg.designWidth || uiConfig.designWidth || 375;

    // 统一模板名称大小写，支持 mobile/Mobile/MOBILE/pc/PC/Pc 等
    const template = (uiConfig.template || 'mobile').toLowerCase();
    const isMobile = template === 'mobile';

    // 处理所有截图，转换为base64
    const imageContents = [];
    const targetWidth = isMobile ? 800 : 1500;

    for (const state of pageGroup.states) {
      const scale = state.scale || 1;
      const compressedBuffer = await sharp(state.file)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .png({ quality: 90 })
        .toBuffer();

      const base64 = compressedBuffer.toString('base64');
      imageContents.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64
        }
      });
      const widthInfo = actualImageWidth ? `，图片实际宽度：${actualImageWidth}px` : '';
      imageContents.push({
        type: 'text',
        text: `【页面状态】${state.state}，说明：${state.description}，原图倍数：@${scale}x，设计稿基准：${designWidth}px${widthInfo}`
      });
    }

    // 处理切图
    const cutImageContents = [];
    if (pageGroup.cutImages && pageGroup.cutImages.length > 0) {
      cutImageContents.push({
        type: 'text',
        text: `\n【设计切图/素材】以下是设计稿中的图标、按钮等独立元素，请参考这些素材的样式和颜色：`
      });
      for (const cut of pageGroup.cutImages) {
        const scale = cut.scale || 1;
        const targetCutWidth = Math.round(200 / scale);

        let cutBuffer;
        try {
          cutBuffer = await sharp(cut.file)
            .resize({ width: targetCutWidth, withoutEnlargement: true })
            .png({ quality: 90 })
            .toBuffer();
        } catch (e) {
          continue;
        }

        const base64 = cutBuffer.toString('base64');
        cutImageContents.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64
          }
        });
        cutImageContents.push({
          type: 'text',
          text: `切图名称：${cut.name}，类型：${cut.type}，倍数：@${scale}x${cut.scope === 'global' ? '（全局素材）' : ''}`
        });
      }
    }

    // 获取设计图实际像素宽度（由 Scanner 自动检测）
    const actualImageWidth = pageGroup.actualImageWidth;

    // 获取图片倍数标记（如 @3x），用于计算设计稿实际标注宽度
    const imageScale = pageGroup.states[0]?.scale || 1;

    // 构建提示词
    const prompt = this.buildPrompt(uiConfig, designWidth, cutImageContents.length > 0, actualImageWidth, imageScale, isMobile);

    const content = [
      { type: 'text', text: prompt },
      ...imageContents,
      ...cutImageContents
    ];

    // 调用 API
    const response = await this.callClaudeAPI(content);

    // 提取代码
    let resultText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        resultText += block.text;
      }
    }
    const codeMatch = resultText.match(/```vue\s*([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : resultText;
  }

  buildPrompt(uiConfig, designWidth, hasCutImages, actualImageWidth = null, imageScale = 1, isMobile = true) {
    const presetCfg = this.preset.get();
    const customRules = this.preset.getPromptRules();

    // 基础 prompt（通用部分）
    let prompt = `你是专业的前端UI还原工程师，请**高度还原**以下设计稿，生成完整的Vue 3单文件组件。

## 核心要求（必须严格遵守）
1. **布局还原**：分析设计稿的每个区域布局，使用flex/grid精准还原位置、间距、对齐方式
2. **颜色还原**：提取设计稿中的所有颜色值（背景色、文字色、边框色、阴影等），精确匹配
3. **组件还原**：使用${uiConfig.name} UI库组件
4. **细节还原**：包括字体大小、行高、圆角、阴影、图标、角标、分割线等所有视觉细节
5. **状态管理**：所有设计图状态整合到同一组件，用v-if/v-else切换

## 空状态处理（重要）
当存在"有数据"和"空数据"两种状态时：
- 使用 ${uiConfig.name} 的空状态组件（${uiConfig.name === 'Vant' ? 'van-empty' : uiConfig.name === 'Element Plus' ? 'el-empty' : 'a-empty'}）
- 用 v-if 判断数据列表是否为空
- 优先展示有数据的模板结构，空状态作为 fallback

## 图片倍数处理（重要）
图片可能带有@2x/@3x倍数标记：
- @1x 图片：尺寸即为实际设计尺寸，直接读取像素值
- @2x 图片：图片尺寸÷2 = 实际设计尺寸
- @3x 图片：图片尺寸÷3 = 实际设计尺寸

当前项目设计稿基准：**${designWidth}px**`;

    // 自动计算并注入 px 倍数规则
    const pxScaleRule = this.buildPxScaleRule(
      actualImageWidth,
      customRules,
      imageScale,
      isMobile
    );
    if (pxScaleRule) {
      prompt += `\n\n## 尺寸转换规则（重要）\n${pxScaleRule}`;
    }

    // 根据 preset 添加项目特定规范
    if (presetCfg.useTypeScript) {
      prompt += `\n- 项目使用 TypeScript，\`<script setup lang="ts">\``;
    }

    if (presetCfg.styleLang === 'scss') {
      prompt += `\n- 样式使用 SCSS（\`<style scoped lang="scss">\`）`;
    } else if (presetCfg.useUnoCSS) {
      prompt += `\n
## UnoCSS 原子类优先
**必须使用UnoCSS原子类编写样式**，减少<style>标签内容。
**重要：所有尺寸类要用带单位的形式**，避免默认乘0.25rem的问题：
- 字体：text-[16px] text-[14px] text-[18px]
- 行高：leading-[24px] leading-[28px]
- 宽高：w-[100px] h-[48px] min-h-[60px] w-full
- 内边距：p-[16px] px-[16px] py-[12px] pt-[8px] pb-[4px]
- 外边距：m-[8px] mb-[12px] mt-[4px] mx-[16px]
- 圆角：rounded-[8px] rounded-[20px] rounded-full

可直接用的原子类（无尺寸问题）：
- 布局：flex items-center justify-between gap-2
- 颜色：bg-[#D92A2A] text-[#333] border-[#F0F0F0]
- 定位：absolute top-0 right-0 z-10 fixed
- 显示：overflow-hidden relative hidden block`;
    }

    // 尺寸单位说明
    if (isMobile && presetCfg.rootValue) {
      prompt += `\n- 移动端项目，使用 px 单位，最终通过 postcss-pxtorem (rootValue: ${presetCfg.rootValue}) 转换为 rem`;
    }
    prompt += `\n\n**所有尺寸单位使用 px**`;

    // 布局组件
    if (presetCfg.layoutComponent) {
      prompt += `\n- 布局统一使用 \`${presetCfg.layoutComponent}\` 组件包裹，不要自己写导航栏`;
    }

    // 工具函数
    if (presetCfg.useToastUtil) {
      prompt += `\n- toast 使用 \`toast.show("消息")\` 而不是 Vant 的 showToast`;
    }
    if (presetCfg.useDialogUtil) {
      prompt += `\n- dialog 使用 \`dialog.confirm("标题", "内容")\` 而不是 Vant 的 showConfirmDialog`;
    }

    // 组件导入模式
    if (presetCfg.componentImportMode === 'auto') {
      prompt += `\n- 组件按需导入，只导入实际使用的组件，不要一次性导入所有`;
    }

    // 预定义主题色
    prompt += `\n
## 预定义主题色（可直接使用）
- primary = #D92A2A（红色主题）
- text-primary = #333, text-secondary = #666, text-placeholder = #999
- bg-page = #F7F8FA, bg-card = #FFFFFF`;

    // 技术规范
    prompt += `\n
## 技术规范
- Vue 3 Composition API + ${presetCfg.useTypeScript ? '<script setup lang="ts">' : '<script setup>'}
- ${isMobile ? '移动端优先' : 'PC端'}
- <style scoped> 只放无法用原子类表达的复杂样式（如动画、伪元素）`;

    // 自定义规则（来自配置文件）
    if (customRules.length > 0) {
      prompt += `\n
## 项目特定规范（必须遵守）
${customRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;
    }

    // 输出格式
    prompt += `\n
## 输出格式
只返回Vue代码，用\`\`\`vue \`\`\`包裹。

## UI组件映射
${JSON.stringify(uiConfig.componentMap, null, 2)}`;

    if (hasCutImages) {
      prompt += `\n
## 设计切图素材
参考切图图标样式，用Vant图标或UnoCSS实现。`;
    }

    prompt += `\n
## 特别提醒
- 每个元素都要完整还原，不能简化
- 不要生成演示用的切换按钮或占位逻辑
- 生成的代码应该是可直接用于生产环境的`;

    return prompt;
  }

  /**
   * 构建 px 尺寸转换规则
   * 根据设计图实际宽度和项目 rootValue 自动计算倍数
   *
   * 区分 PC 和 H5：
   * - H5（mobile）：使用 amfe-flexible + postcss-pxtorem，需要 rootValue 计算倍数
   * - PC（非 mobile）：直接使用设计稿标注宽度，不需要 px 转换
   *
   * 支持 @2x/@3x 图片：图片实际像素宽度 ÷ 图片倍数 = 设计稿标注宽度
   *
   * @param {number|null} actualImageWidth - 图片实际像素宽度
   * @param {number} rootValue - postcss-pxtorem 的 rootValue
   * @param {string[]} customRules - 已有的自定义规则（用于去重检测）
   * @param {number} imageScale - 图片倍数标记（如 @3x 的 3，默认 1）
   * @param {boolean} isMobile - 是否为移动端项目（H5）
   * @returns {string|null} 转换规则文本，无需转换时返回 null
   */
  buildPxScaleRule(actualImageWidth, customRules = [], imageScale = 1, isMobile = true) {
    if (!actualImageWidth || actualImageWidth <= 0) return null;

    // 设计稿标注宽度 = 图片实际像素宽度 ÷ 图片倍数
    const designDraftWidth = Math.round(actualImageWidth / imageScale);

    // ── PC 项目 ──
    // PC 按 1920×1080 标准输出，无需 px 转换
    if (!isMobile) {
      if (imageScale > 1) {
        return `图片为 @${imageScale}x（${actualImageWidth}px），设计稿标注宽度为 ${designDraftWidth}px。请按设计稿标注尺寸直接输出 px 值。`;
      }
      return null;
    }

    // ── H5 项目 ──
    // H5 以 375px 为逻辑基准，@1x=375 / @2x=750 / @3x=1125，逻辑宽度始终是 375px
    // 项目可能按 750px 标准配置（rootValue=75），需要告诉 AI 转换倍数
    const presetCfg = this.preset.get();

    // 项目设计标准宽度：优先用配置项，其次按 rootValue*10 推导
    const projectStandard = presetCfg.projectStandardWidth
      || (presetCfg.rootValue ? presetCfg.rootValue * 10 : null);

    if (!projectStandard || projectStandard <= 0) return null;

    const scale = projectStandard / designDraftWidth;

    // 无需转换的情况（倍数接近 1）
    if (Math.abs(scale - 1) < 0.05) return null;

    // 检查 customRules 中是否已有类似规则（避免重复注入）
    const hasExistingRule = customRules.some(rule => {
      const lower = rule.toLowerCase();
      return lower.includes('乘以') || lower.includes('pxtorem') ||
             lower.includes('designwidth') || lower.includes('rootvalue') ||
             lower.includes('设计稿') || lower.includes('rootValue');
    });
    if (hasExistingRule) return null;

    const scaleText = scale % 1 === 0 ? String(scale) : scale.toFixed(2);

    let rule = `设计图实际宽度为 ${designDraftWidth}px`;
    if (imageScale > 1) {
      rule += `（原始图片 ${actualImageWidth}px，@${imageScale}x）`;
    }
    rule += `，但项目使用 ${projectStandard}px 设计稿标准（postcss-pxtorem rootValue: ${presetCfg.rootValue}）。请将所有视觉测量的尺寸（width、height、padding、margin、font-size、line-height、border-radius、gap 等）乘以 ${scaleText} 后再输出 px 值，例如图片上测量为 100px 的元素，代码中写 ${Math.round(100 * scale)}px`;

    return rule;
  }

  async callClaudeAPI(content) {
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };

    const body = {
      model: this.model,
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: content
        }
      ]
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}
