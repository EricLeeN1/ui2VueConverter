import DashScope from '@alicloud/dashscope';
import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';

export class ApiClient {
  constructor(apiKey = null) {
    // 优先使用传入的密钥，其次读取本地配置文件，最后读取环境变量
    let finalApiKey = apiKey;

    if (!finalApiKey) {
      // 尝试读取本地配置文件
      const configPath = path.join(process.cwd(), '.ui-to-vue.config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = fs.readJSONSync(configPath);
          finalApiKey = config.apiKey;
        } catch (e) {
          // 读取失败继续尝试环境变量
        }
      }
    }

    if (!finalApiKey) {
      finalApiKey = process.env.DASHSCOPE_API_KEY;
    }

    if (!finalApiKey) {
      throw new Error('未配置DASHSCOPE_API_KEY，请通过环境变量或配置文件设置API密钥');
    }

    this.client = new DashScope({ apiKey: finalApiKey });
  }

  async generateVueCode(pageGroup, uiConfig) {
    // 处理所有截图，转换为base64
    const images = [];
    for (const state of pageGroup.states) {
      // 压缩图片减少token消耗
      const compressedBuffer = await sharp(state.file)
        .resize({ width: 800, withoutEnlargement: true })
        .png({ quality: 80 })
        .toBuffer();

      const base64 = compressedBuffer.toString('base64');
      images.push({
        image: `data:image/png;base64,${base64}`,
        caption: `状态：${state.state}，说明：${state.description}`
      });
    }

    // 构建提示词
    const prompt = `
你是专业的前端工程师，根据提供的多个设计图状态，生成一个完整的Vue 3单文件组件。

要求：
1. 使用Vue 3 Composition API + <script setup>语法
2. 使用${uiConfig.name} UI库，优先使用以下组件：${Object.values(uiConfig.componentMap).join(', ')}
3. 所有设计图状态整合到同一个组件中，使用v-if/v-else根据页面状态切换显示
4. 响应式布局，适配对应终端（${uiConfig.template === 'mobile' ? '移动端' : 'PC端'}）
5. 代码结构清晰，命名规范，添加必要的注释
6. 只返回Vue代码，不要任何其他解释和说明
7. 代码使用\`\`\`vue \`\`\`包裹

UI库组件映射参考：
${JSON.stringify(uiConfig.componentMap, null, 2)}
`;

    // 调用API
    const response = await this.client.multimodalGeneration.call({
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { text: prompt },
              ...images
            ]
          }
        ]
      },
      parameters: {
        max_tokens: 4000,
        temperature: 0.1
      }
    });

    // 提取代码
    const content = response.output.choices[0].message.content;
    const codeMatch = content.match(/```vue([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : content;
  }
}
