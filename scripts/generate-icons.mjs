import sharp from 'sharp'
import { writeFileSync } from 'fs'

const SIZES = [192, 512]
const FG = '#ffffff'
const BG = '#0d1117'

for (const size of SIZES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${BG}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="${size * 0.5}px" fill="${FG}">C</text>
</svg>`

  await sharp(Buffer.from(svg)).png().toFile(`public/pwa-${size}x${size}.png`)
  console.log(`Generated public/pwa-${size}x${size}.png`)
}

/* apple-touch-icon (180x180) */
const svg180 = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="36" fill="${BG}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="90px" fill="${FG}">C</text>
</svg>`

await sharp(Buffer.from(svg180)).png().toFile('public/apple-touch-icon.png')
console.log('Generated public/apple-touch-icon.png')
