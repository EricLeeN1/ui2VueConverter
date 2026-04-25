import { BaseProvider } from './base-provider.js';

const DEFAULT_URL = 'https://coding.dashscope.aliyuncs.com/apps/anthropic/v1/messages';

/**
 * Anthropic Messages API Provider
 * 兼容 DashScope Coding Plan（国内常用）
 * 格式：x-api-key + anthropic-version + messages
 */
export class AnthropicProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.url = config.url || DEFAULT_URL;
    this.apiVersion = config.apiVersion || '2023-06-01';
  }

  async chat(content) {
    const headers = {
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion,
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
    return {
      content: result.content || []
    };
  }
}
