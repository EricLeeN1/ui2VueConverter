import { BaseProvider } from './base-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { OpenAIProvider } from './openai-provider.js';

/**
 * Provider 工厂
 * 根据配置创建对应的 Provider 实例
 *
 * 配置示例：
 * - DashScope (Anthropic 兼容):
 *   { "provider": "anthropic", "url": "...", "apiKey": "...", "model": "qwen3.6-plus" }
 *
 * - OpenAI / 兼容平台:
 *   { "provider": "openai", "url": "...", "apiKey": "...", "model": "gpt-4o" }
 */
export function createProvider(config) {
  const providerType = config.provider || 'anthropic';

  switch (providerType) {
    case 'anthropic':
    case 'dashscope':
      return new AnthropicProvider(config);

    case 'openai':
    case 'generic':
      return new OpenAIProvider(config);

    default:
      throw new Error(
        `不支持的 Provider 类型: "${providerType}"\n` +
        `支持的类型: anthropic | dashscope | openai | generic`
      );
  }
}

export { BaseProvider, AnthropicProvider, OpenAIProvider };
