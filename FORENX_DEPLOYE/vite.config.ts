import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes the API key from Netlify's environment variables 
    // available to your application's code.
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  }
});
