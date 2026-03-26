export class ComponentExtractor {
  constructor(pageGroups, uiConfig) {
    this.pageGroups = pageGroups;
    this.uiConfig = uiConfig;
    this.commonComponents = [];
  }

  async analyze() {
    // 识别常见公共组件模式（出现2次以上则抽离为公共组件）
    const commonPatterns = [
      { name: 'Header', pattern: /导航栏|header|navbar/i },
      { name: 'Footer', pattern: /底部|footer/i },
      { name: 'SearchBar', pattern: /搜索栏|search/i },
      { name: 'ListCard', pattern: /列表项|card|item/i },
      { name: 'ConfirmModal', pattern: /确认弹窗|confirm/i },
      { name: 'Toast', pattern: /提示|toast/i }
    ];

    for (const pattern of commonPatterns) {
      let occurrenceCount = 0;

      // 统计该模式在多少个页面中出现
      for (const page of this.pageGroups) {
        const hasPattern = page.states.some(state =>
          pattern.pattern.test(state.description)
        );
        if (hasPattern) occurrenceCount++;
      }

      if (occurrenceCount >= 2) {
        this.commonComponents.push({
          name: pattern.name,
          fileName: `${pattern.name}.vue`,
          pattern: pattern.pattern
        });
      }
    }

    return this.commonComponents;
  }
}
