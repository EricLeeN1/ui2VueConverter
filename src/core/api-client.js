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
    // 处理所有截图，转换为base64
    const imageContents = [];
    for (const state of pageGroup.states) {
      // 压缩图片减少token消耗
      const compressedBuffer = await sharp(state.file)
        .resize({ width: 800, withoutEnlargement: true })
        .png({ quality: 80 })
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
        text: `【页面状态】${state.state}，说明：${state.description}`
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
        // 切图保持原尺寸或适当缩放
        let cutBuffer;
        try {
          cutBuffer = await sharp(cut.file)
            .resize({ width: 200, withoutEnlargement: true })
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
          text: `切图名称：${cut.name}，类型：${cut.type}${cut.global ? '（全局素材）' : ''}`
        });
      }
    }

    // 构建提示词
    const hasCutImages = cutImageContents.length > 0;
    const prompt = `你是专业的前端工程师，根据提供的多个设计图状态${hasCutImages ? '和设计切图素材' : ''}，生成一个完整的Vue 3单文件组件。

要求：
1. 使用Vue 3 Composition API + <script setup>语法
2. 使用${uiConfig.name} UI库，优先使用以下组件：${Object.values(uiConfig.componentMap).join(', ')}
3. 所有设计图状态整合到同一个组件中，使用v-if/v-else根据页面状态切换显示
4. 响应式布局，适配对应终端（${uiConfig.template === 'mobile' ? '移动端' : 'PC端'}）
5. 代码结构清晰，命名规范，添加必要的注释
6. 只返回Vue代码，不要任何其他解释和说明
7. 代码使用\`\`\`vue \`\`\`包裹
${hasCutImages ? `8. 参考提供的切图素材，尽可能还原图标、按钮的样式和颜色，可以使用CSS实现或建议使用对应的Vant图标` : ''}

UI库组件映射参考：
${JSON.stringify(uiConfig.componentMap, null, 2)}`;

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