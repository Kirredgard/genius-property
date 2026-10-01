import { defineConfig } from 'vite';

// En dev, /app sert l'application (app.html) et /connexion la page de connexion, comme sur Vercel.
const appRoutes = () => ({
  name: 'gp-app-routes',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = (req.url || '').split('?')[0];
      if (url === '/app' || url === '/app/') req.url = '/app.html';
      else if (url === '/connexion' || url === '/connexion/') req.url = '/connexion.html';
      next();
    });
  }
});

export default defineConfig({
  root: '.',
  plugins: [appRoutes()],
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: 'index.html',
        app: 'app.html',
        connexion: 'connexion.html'
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
