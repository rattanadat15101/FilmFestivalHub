import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⚡️ เพิ่มส่วน 'server' เพื่อตั้งค่า Proxy ⚡️
  server: {
    proxy: {
      // เมื่อไหร่ก็ตามที่ Client เรียก /api/...
      '/api': {
        // ให้ส่ง (Forward) การเรียกนั้นไปที่ Server Backend ที่นี่
        target: 'http://localhost:4000', 
        // สำคัญ: เปลี่ยน Host Header ของ Request ให้ตรงกับ Target
        changeOrigin: true, 
        // หากต้องการให้ Server Response ถูกส่งกลับมาด้วย Path เดิม (ไม่ค่อยจำเป็นในกรณีนี้)
        // rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
  },
})