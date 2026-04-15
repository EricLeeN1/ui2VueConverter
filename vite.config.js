import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import postcsspxtorem from 'postcss-pxtorem'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS()
  ],
  css: {
    postcss: {
      plugins: [
        autoprefixer(),
        postcsspxtorem({
          rootValue: 37.5,  // 375px设计稿，vant组件标准
          propList: ['*'],
          minPixelValue: 2
        })
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})