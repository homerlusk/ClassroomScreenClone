import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ClassroomScreenClone/', // 👈 Add this exact line (case-sensitive)
})