import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function stripPrivateFiles(staging) {
  let root
  return {
    name: 'strip-private-files',
    apply: 'build',
    configResolved(config) {
      root = resolve(config.root, config.build.outDir)
    },
    transformIndexHtml() {
      if (staging) return [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex,nofollow' }, injectTo: 'head' }]
    },
    async closeBundle() {
      await Promise.all([
        rm(resolve(root, 'api/config.php'), { force: true }),
        rm(resolve(root, 'api/config.example copy.php'), { force: true }),
        rm(resolve(root, 'uploads'), { recursive: true, force: true }),
      ])
      const data = resolve(root, 'api/data')
      for (const file of await readdir(data).catch(() => [])) {
        if (file === 'guides.json' || file === 'homepage.live.json' || file.endsWith('.jsonl') || file.startsWith('rate_') || file === 'travel_leads.json') {
          await rm(resolve(data, file), { force: true })
        }
      }
      if (staging) {
        await writeFile(resolve(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
        await rm(resolve(root, 'sitemap.xml'), { force: true })
      } else {
        await rm(resolve(root, 'images/guest-photo-placeholder.svg'), { force: true })
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), stripPrivateFiles(mode === 'staging')],
  build: { outDir: mode === 'staging' ? 'dist-dev' : 'dist' },
  base: '/',
  server: {
    proxy: {
      // Local: run `php -S 127.0.0.1:8080 -t public` then npm run dev
      '/api': {
        target: process.env.LUMICHAN_API_PROXY || 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
}))
