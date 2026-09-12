import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const OUT = new URL('../public/icons/', import.meta.url)
const ROOT = new URL('../public/', import.meta.url)
const out = (name) => fileURLToPath(new URL(name, OUT))
const root = (name) => fileURLToPath(new URL(name, ROOT))

const disc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="label" cx="0.35" cy="0.35" r="1">
      <stop offset="0" stop-color="#ffd27a"/>
      <stop offset="1" stop-color="#d97a1e"/>
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="190" fill="#0a0a10"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="#2a2a38" stroke-width="2"/>
  <g stroke="#ffffff" opacity="0.04" fill="none">
    <circle cx="256" cy="256" r="148"/>
    <circle cx="256" cy="256" r="136"/>
    <circle cx="256" cy="256" r="124"/>
    <circle cx="256" cy="256" r="112"/>
    <circle cx="256" cy="256" r="100"/>
  </g>
  <path d="M112 195 A190 190 0 0 1 256 66" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" opacity="0.06"/>
  <circle cx="256" cy="256" r="72" fill="url(#label)"/>
  <circle cx="256" cy="256" r="72" fill="none" stroke="#ffd27a" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="256" cy="256" r="50" fill="#b85c14" opacity="0.18"/>
  <path d="M256 218 a38 38 0 0 1 0 76" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="6" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="12" fill="#0a0a10"/>
</svg>`

const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#161d36"/>
      <stop offset="1" stop-color="#070a18"/>
    </linearGradient>
    <radialGradient id="label" cx="0.35" cy="0.35" r="1">
      <stop offset="0" stop-color="#ffd27a"/>
      <stop offset="1" stop-color="#d97a1e"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    <circle cx="256" cy="256" r="190" fill="#0a0a10"/>
    <circle cx="256" cy="256" r="190" fill="none" stroke="#2a2a38" stroke-width="2"/>
    <g stroke="#ffffff" opacity="0.04" fill="none">
      <circle cx="256" cy="256" r="148"/>
      <circle cx="256" cy="256" r="136"/>
      <circle cx="256" cy="256" r="124"/>
      <circle cx="256" cy="256" r="112"/>
      <circle cx="256" cy="256" r="100"/>
    </g>
    <path d="M112 195 A190 190 0 0 1 256 66" fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" opacity="0.06"/>
    <circle cx="256" cy="256" r="72" fill="url(#label)"/>
    <circle cx="256" cy="256" r="72" fill="none" stroke="#ffd27a" stroke-opacity="0.35" stroke-width="1.5"/>
    <circle cx="256" cy="256" r="50" fill="#b85c14" opacity="0.18"/>
    <path d="M256 218 a38 38 0 0 1 0 76" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="6" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="12" fill="#0a0a10"/>
  </g>
</svg>`

await mkdir(OUT, { recursive: true })

await sharp(Buffer.from(disc)).resize(192, 192).png().toFile(out('icon-192.png'))
await sharp(Buffer.from(disc)).resize(512, 512).png().toFile(out('icon-512.png'))
await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(out('icon-512-maskable.png'))
await sharp(Buffer.from(disc)).resize(180, 180).png().toFile(root('apple-touch-icon.png'))

console.log('generated: icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png')