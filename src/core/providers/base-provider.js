/**
 * Provider 基类
 * 抽象不同 LLM API 的调用方式，统一返回格式
 */
export class BaseProvider {
  constructor(config) {
    this.config = config || {};
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.url = config.url;

    if (!this.apiKey) {
      throw new Error(
        '未配置 API Key，请通过以下方式设置：\n' +
        '1. 配置文件 .ui-to-vue.config.json 的 apiKey 字段\n' +
        '2. 环境变量 UI_TO_VUE_API_KEY（推荐）\n' +
        '3. 兼容旧版环境变量 DASHSCOPE_API_KEY'
      );
    }
  }

  /**
   * 发送多模态消息
   * @param {Array} content - 消息内容数组 [{ type: 'text', text: '...' }, { type: 'image', source: {...} }]
   * @returns {Promise<{content: Array}>} - 统一返回格式
   */
  async chat(content) {
    throw new Error('子类必须实现 chat() 方法');
  }
}
