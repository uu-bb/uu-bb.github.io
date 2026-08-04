import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error Shared build-time renderer is intentionally plain JavaScript.
import { renderStaticPortfolio, renderStructuredData } from './scripts/static-portfolio.mjs'

const publicContent = JSON.parse(
  readFileSync(new URL('./src/data/public-content.generated.json', import.meta.url), 'utf8'),
)
const staticPortfolio = renderStaticPortfolio(publicContent)
const structuredData = renderStructuredData(publicContent)
const structuredDataHash = createHash('sha256').update(structuredData).digest('base64')

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'portfolio-static-html',
      transformIndexHtml(html) {
        return html
          .replace('<!-- PORTFOLIO_STATIC_FALLBACK -->', staticPortfolio)
          .replace('<!-- PORTFOLIO_NOSCRIPT_FALLBACK -->', staticPortfolio)
          .replace(
            '<!-- PORTFOLIO_JSON_LD -->',
            `<script type="application/ld+json">${structuredData}</script>`,
          )
          .replace(
            "script-src 'self'",
            `script-src 'self' 'sha256-${structuredDataHash}'`,
          )
      },
    },
  ],
  build: {
    sourcemap: false,
  },
})
