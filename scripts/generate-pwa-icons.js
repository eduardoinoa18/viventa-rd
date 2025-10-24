// Script to generate PWA icon sizes from base icon
// Run with: node scripts/generate-pwa-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/icons/icon-512.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('📱 Generating PWA icons...');
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Source icon not found:', sourceIcon);
    console.log('Using existing icons...');
    return;
  }

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size}:`, error.message);
    }
  }

  // Generate maskable icon (with padding for safe area)
  const maskablePath = path.join(outputDir, 'maskable-icon.png');
  try {
    await sharp(sourceIcon)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 11, g: 37, b: 69, alpha: 1 } // VIVENTA brand color
      })
      .extend({
        top: 102,
        bottom: 102,
        left: 102,
        right: 102,
        background: { r: 11, g: 37, b: 69, alpha: 1 }
      })
      .png()
      .toFile(maskablePath);
    
    console.log('✅ Generated maskable icon');
  } catch (error) {
    console.error('❌ Failed to generate maskable icon:', error.message);
  }

  console.log('✨ Icon generation complete!');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.log('⚠️  Sharp not installed. Run: npm install --save-dev sharp');
  console.log('Using existing icons for now...');
}
