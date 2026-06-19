import { definePlugin } from 'vite'
import vue from '@vitejs/plugin-vue'

export default definePlugin({
  name: 'antstack-vite',
  config() {
    return {
      root: '.',
      publicDir: 'src-app/public',
      build: {
        outDir: 'dist'
      },
      plugins: [vue()]
    }
  }
})
