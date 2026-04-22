/**
 * Generate placeholder PWA icons
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const color = '#059669'; // emerald-600

sizes.forEach((size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">HF</text>
</svg>`;

  const outputPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}.png`);
  
  // For now, just save as SVG since we don't have a PNG converter
  const svgPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated ${svgPath}`);
});

console.log('\nNote: SVG icons created. For production, convert these to PNG using an image tool.');
console.log('You can use: https://cloudconvert.com/svg-to-png or install sharp/canvas for Node.js conversion.');
