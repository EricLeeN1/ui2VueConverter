import { BaseProvider } from './base-provider.js';

/**
 * OpenAI Chat Completions API Provider
 * 支持 OpenAI、Azure、国内兼容平台等
 * 格式：Authorization Bearer + messages
 */
export class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    if (!this.url) {
      throw new Error(
        'OpenAI Provider 必须配置 url，例如：\n' +
        '"url": "https://api.openai.com/v1/chat/completions"'
      );
    }
  }

  async chat(content) {
    // 将多模态 content 转换为 OpenAI 格式
    const messages = this.convertToOpenAIMessages(content);

    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const body = {
      model: this.model,
      max_tokens: 8192,
      messages: messages
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API调用失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // 统一返回格式
    const textContent = result.choices?.[0]?.message?.content || '';
    return {
      content: [
        { type: 'text', text: textContent }
      ]
    };
  }

  /**
   * 将 Anthropic 格式的多模态 content 转换为 OpenAI 格式
   */
  convertToOpenAIMessages(content) {
    const userContent = content.map(item => {
      if (item.type === 'text') {
        return { type: 'text', text: item.text };
      }
      if (item.type === 'image') {
        // OpenAI 支持 base64 图片
        return {
          type: 'image_url',
          image_url: {
            url: `data:${item.source.media_type};base64,${item.source.data}`
          }
        };
      }
      return item;
    });

    return [
      {
        role: 'user',
        content: userContent
      }
    ];
  }
}
