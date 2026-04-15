import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/'
    })
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-col-center': 'flex flex-col items-center justify-center'
  },
  rules: [
    // 自定义规则，用于精确还原设计稿
    ['safe-area-bottom', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
  ],
  theme: {
    colors: {
      primary: '#D92A2A',
      'primary-light': '#E66A6A',
      danger: '#D92A2A',
      warning: '#FF9900',
      text: {
        primary: '#333333',
        secondary: '#666666',
        placeholder: '#999999',
        white: '#FFFFFF'
      },
      bg: {
        page: '#F7F8FA',
        card: '#FFFFFF',
        header: '#D92A2A'
      },
      border: {
        light: '#F0F0F0',
        divider: '#EEEEEE'
      }
    },
    fontSize: {
      '12': '12px',
      '14': '14px',
      '16': '16px',
      '18': '18px',
      '20': '20px',
      '24': '24px',
      '28': '28px',
      '32': '32px'
    },
    lineHeight: {
      '20': '20px',
      '22': '22px',
      '24': '24px',
      '28': '28px',
      '32': '32px',
      '36': '36px',
      '40': '40px'
    },
    // 间距配置（padding/margin）
    spacing: {
      '0': '0px',
      '1': '4px',
      '2': '8px',
      '3': '12px',
      '4': '16px',
      '5': '20px',
      '6': '24px',
      '8': '32px',
      '10': '40px',
      '12': '48px',
      '16': '64px',
      '20': '80px',
      '24': '96px'
    }
  }
})