import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // O `netlify dev` guarda os Blobs locais em .netlify/; observá-los derruba o Vite no Windows (EBUSY).
  server: { watch: { ignored: ['**/.netlify/**'] } },
});
