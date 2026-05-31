import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      __GEMINI_API_KEY__: JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '',
      ),
    },
  };
});
