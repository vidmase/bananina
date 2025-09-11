import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.KIE_API_KEY),
        'process.env.KIE_API_KEY': JSON.stringify(env.KIE_API_KEY),
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY)
      },
      server: {
        host: true, // listen on all addresses, including LAN
        port: 5173,
        strictPort: true, // fail instead of switching ports silently
        open: true, // auto-open in default browser
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
