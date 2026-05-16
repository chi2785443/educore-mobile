/**
 * Generates all EduCore app icons and splash assets from SVG sources.
 * Run: node scripts/generate-icons.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dir, '..', 'assets', 'images');

function svgToPng(svgPath, outPath, width, height) {
  const svg = readFileSync(svgPath, 'utf-8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: 'transparent',
    font: { loadSystemFonts: false },
  });
  const png = resvg.render().asPng();
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath.split(/[\\/]/).slice(-2).join('/')}  (${width}×${height ?? width})`);
}

// --- Icon (light bg context, white background for app icon) ---
// We use the dark variant for the icon so it shows well on any OS chrome
const iconSvg  = join(ASSETS, 'educore_icon_dark.svg');
const logoSvg  = join(ASSETS, 'educore_logo_dark.svg');

// App icon wraps the icon in a branded bg. We build a composite SVG:
function makeIconSvg(size) {
  const iconContent = readFileSync(join(ASSETS, 'educore_icon_dark.svg'), 'utf-8')
    .replace(/<svg[^>]*>/, '')
    .replace('</svg>', '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Brand background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0B0F14"/>
  <!-- Subtle radial glow -->
  <radialGradient id="glow" cx="50%" cy="45%" r="55%">
    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="#0B0F14" stop-opacity="0"/>
  </radialGradient>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#glow)"/>
  <!-- Icon centred, scaled to 58% of canvas -->
  <g transform="translate(${size * 0.21}, ${size * 0.195}) scale(${(size * 0.58) / 120})">
    <polygon points="10,40 60,15 110,40 60,65" fill="#FFFFFF"/>
    <path d="M20 50 Q40 42 55 50 L55 90 Q40 82 20 90 Z" fill="#FF6A00"/>
    <path d="M65 50 Q80 42 100 50 L100 90 Q80 82 65 90 Z" fill="#1E63B5"/>
    <circle cx="60" cy="58" r="8" fill="#0B0F14"/>
  </g>
</svg>`;
}

// Adaptive icon foreground (Android) — icon on transparent background
function makeAdaptiveFgSvg(size) {
  const scale = (size * 0.5) / 120;
  const ox = size * 0.25;
  const oy = size * 0.24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${ox}, ${oy}) scale(${scale})">
    <polygon points="10,40 60,15 110,40 60,65" fill="#FFFFFF"/>
    <path d="M20 50 Q40 42 55 50 L55 90 Q40 82 20 90 Z" fill="#FF6A00"/>
    <path d="M65 50 Q80 42 100 50 L100 90 Q80 82 65 90 Z" fill="#1E63B5"/>
    <circle cx="60" cy="58" r="8" fill="#0B0F14"/>
  </g>
</svg>`;
}

// Adaptive icon background (Android) — solid brand colour
function makeAdaptiveBgSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#0B0F14"/>
  <radialGradient id="g" cx="50%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#0B0F14" stop-opacity="0"/>
  </radialGradient>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
</svg>`;
}

// Monochrome icon (Android notification / greyscale)
function makeMonoSvg(size) {
  const scale = (size * 0.58) / 120;
  const ox = size * 0.21;
  const oy = size * 0.195;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${ox}, ${oy}) scale(${scale})">
    <polygon points="10,40 60,15 110,40 60,65" fill="#FFFFFF"/>
    <path d="M20 50 Q40 42 55 50 L55 90 Q40 82 20 90 Z" fill="#AAAAAA"/>
    <path d="M65 50 Q80 42 100 50 L100 90 Q80 82 65 90 Z" fill="#CCCCCC"/>
    <circle cx="60" cy="58" r="8" fill="#000000"/>
  </g>
</svg>`;
}

// Splash screen — logo centred on dark brand bg
function makeSplashSvg(w, h) {
  // Logo aspect 420:120 = 3.5:1. We render it at width 55% of canvas.
  const logoW = w * 0.55;
  const logoH = logoW / 3.5;
  const lx = (w - logoW) / 2;
  const ly = (h - logoH) / 2;
  const scale = logoW / 420;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#0B0F14"/>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#6366f1" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#0B0F14" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <!-- Logo: icon + text centred -->
  <g transform="translate(${lx}, ${ly}) scale(${scale})">
    <!-- EduCore Icon -->
    <g transform="translate(0,0)">
      <polygon points="10,40 60,15 110,40 60,65" fill="#FFFFFF"/>
      <path d="M20 50 Q40 42 55 50 L55 90 Q40 82 20 90 Z" fill="#FF6A00"/>
      <path d="M65 50 Q80 42 100 50 L100 90 Q80 82 65 90 Z" fill="#1E63B5"/>
      <circle cx="60" cy="58" r="8" fill="#0B0F14"/>
    </g>
    <!-- Text: Edu -->
    <text x="135" y="75" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#FFFFFF" font-weight="600">Edu</text>
    <!-- Text: Core -->
    <text x="235" y="75" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#FF6A00" font-weight="600">Core</text>
  </g>
</svg>`;
}

function svgStringToPng(svgStr, outPath, label) {
  const resvg = new Resvg(svgStr, {
    fitTo: { mode: 'original' },
    font: { loadSystemFonts: false },
  });
  const png = resvg.render().asPng();
  writeFileSync(outPath, png);
  console.log(`✓ ${label}`);
}

// Generate all assets
console.log('\n🎨  Generating EduCore app assets...\n');

// iOS / universal app icon (1024×1024)
svgStringToPng(makeIconSvg(1024),  join(ASSETS, 'icon.png'), 'icon.png (1024×1024)');

// Android adaptive icon foreground (1024×1024 on transparent bg)
svgStringToPng(makeAdaptiveFgSvg(1024), join(ASSETS, 'android-icon-foreground.png'), 'android-icon-foreground.png');

// Android adaptive icon background (1024×1024 solid brand)
svgStringToPng(makeAdaptiveBgSvg(1024), join(ASSETS, 'android-icon-background.png'), 'android-icon-background.png');

// Android monochrome icon
svgStringToPng(makeMonoSvg(1024), join(ASSETS, 'android-icon-monochrome.png'), 'android-icon-monochrome.png');

// Favicon (64×64)
svgStringToPng(makeIconSvg(64), join(ASSETS, 'favicon.png'), 'favicon.png (64×64)');

// Splash icon — centred logo (1284×2778 = max iPhone resolution)
svgStringToPng(makeSplashSvg(1284, 2778), join(ASSETS, 'splash-icon.png'), 'splash-icon.png (1284×2778)');

console.log('\n✅  All assets generated successfully.\n');
