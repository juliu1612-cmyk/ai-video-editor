import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径:兼容 GitHub Pages 子路径部署与 file:// 双击打开
  base: './',
  plugins: [react(), viteSingleFile()],
})
