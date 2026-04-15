import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';

const CLAUDE_API_URL = 'https://coding.dashscope.aliyuncs.com/apps/anthropic/v1/messages';

export class ApiClient {
  constructor(apiKey = null) {
    // 优先使用传入的密钥，其次读取本地配置文件，最后读取环境变量
    let finalApiKey = apiKey;

    if (!finalApiKey) {
      // 尝试读取本地配置文件（支持两种文件名）
      const configPaths = [
        path.join(process.cwd(), 'ui-to-vue.config.json'),
        path.join(process.cwd(), '.ui-to-vue.config.json')
      ];
      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          try {
            const config = fs.readJSONSync(configPath);
            finalApiKey = config.apiKey;
            if (finalApiKey) break;
          } catch (e) {
            // 读取失败继续尝试下一个
          }
        }
      }
    }

    if (!finalApiKey) {
      finalApiKey = process.env.DASHSCOPE_API_KEY;
    }

    if (!finalApiKey) {
      throw new Error('未配置DASHSCOPE_API_KEY，请通过环境变量或配置文件设置API密钥');
    }

    this.apiKey = finalApiKey;
  }

  async generateVueCode(pageGroup, uiConfig) {
    // 获取设计稿宽度配置
    const designWidth = uiConfig.designWidth || 375;

    // 处理所有截图，转换为base64
    const imageContents = [];

    // 固定压缩尺寸：移动端 800px，PC端 1500px（平衡清晰度和 token 消耗）
    const targetWidth = uiConfig.template === 'mobile' ? 800 : 1500;

    for (const state of pageGroup.states) {
      const scale = state.scale || 1;

      // 压缩图片到固定尺寸，保持清晰度
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
      imageContents.push({
        type: 'text',
        text: `【页面状态】${state.state}，说明：${state.description}，原图倍数：@${scale}x，设计稿基准：${designWidth}px`
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
        // 根据倍数调整切图压缩尺寸
        const scale = cut.scale || 1;
        const targetWidth = Math.round(200 / scale);

        let cutBuffer;
        try {
          cutBuffer = await sharp(cut.file)
            .resize({ width: targetWidth, withoutEnlargement: true })
            .png({ quality: 90 })
            .toBuffer();
        } catch (e) {
          // SVG 或其他格式可能失败，跳过
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

    // 构建提示词
    const hasCutImages = cutImageContents.length > 0;

    // 计算设计稿基准宽度（根据图片倍数）
    const scales = pageGroup.states.map(s => s.scale || 1);
    const maxScale = Math.max(...scales);
    const baseDesignWidth = 375;  // 移动端标准设计稿宽度

    const prompt = `你是专业的前端UI还原工程师，请**高度还原**以下设计稿，生成完整的Vue 3单文件组件。

## 核心要求（必须严格遵守）
1. **布局还原**：分析设计稿的每个区域布局，使用flex/grid精准还原位置、间距、对齐方式
2. **颜色还原**：提取设计稿中的所有颜色值（背景色、文字色、边框色、阴影等），精确匹配
3. **组件还原**：使用${uiConfig.name} UI库组件，配合UnoCSS原子类自定义样式匹配设计稿
4. **细节还原**：包括字体大小、行高、圆角、阴影、图标、角标、分割线等所有视觉细节
5. **状态管理**：所有设计图状态整合到同一组件，用v-if/v-else切换

## 空状态处理（重要）
当存在"有数据"和"空数据"两种状态时：
- 使用 ${uiConfig.name} 的空状态组件（${uiConfig.name === 'Vant' ? 'van-empty' : uiConfig.name === 'Element Plus' ? 'el-empty' : 'a-empty'}）
- 用 v-if 判断数据列表是否为空
- 优先展示有数据的模板结构，空状态作为 fallback
- 示例：
\`\`\`vue
<template>
  <div v-if="list.length > 0">
    <!-- 有数据列表 -->
  </div>
  ${uiConfig.name === 'Vant' ? '<van-empty v-else description="暂无数据" />' : uiConfig.name === 'Element Plus' ? '<el-empty v-else description="暂无数据" />' : '<a-empty v-else description="暂无数据" />'}
</template>
\`\`\`

## 图片倍数处理（重要）
图片可能带有@2x/@3x倍数标记：
- @1x 图片：尺寸即为实际设计尺寸，直接读取像素值
- @2x 图片：图片尺寸÷2 = 实际设计尺寸
- @3x 图片：图片尺寸÷3 = 实际设计尺寸

当前项目设计稿基准：**${designWidth}px**
${uiConfig.template === 'mobile' && uiConfig.rootValue
  ? `- 移动端项目，使用 px 单位，最终通过 postcss-pxtorem (rootValue: ${uiConfig.rootValue}) 转换为 rem`
  : '- 直接使用 px 单位'}

**所有尺寸单位使用 px**

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
- 显示：overflow-hidden relative hidden block

## 预定义主题色（可直接使用）
- primary = #D92A2A（红色主题）
- text-primary = #333, text-secondary = #666, text-placeholder = #999
- bg-page = #F7F8FA, bg-card = #FFFFFF

## 技术规范
- Vue 3 Composition API + <script setup>
- ${uiConfig.template === 'mobile' ? '移动端优先，375px基准' : 'PC端'}
- <style scoped> 只放无法用原子类表达的复杂样式（如动画、伪元素）

## 输出格式
只返回Vue代码，用\`\`\`vue \`\`\`包裹。

## UI组件映射
${JSON.stringify(uiConfig.componentMap, null, 2)}

${hasCutImages ? `## 设计切图素材
参考切图图标样式，用Vant图标或UnoCSS实现。` : ''}

## 特别提醒
- 每个元素都要完整还原，不能简化
- 优先用UnoCSS原子类，少量复杂样式用scoped CSS`;

    // 构建 content 数组（Anthropic 格式）
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

  async callClaudeAPI(content) {
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };

    const body = {
      model: 'qwen3.6-plus',
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