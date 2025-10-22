const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Create a simple teal square with white "V" letter
const createIcon = async (size) => {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#00A676"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" 
            font-weight="bold" fill="white" text-anchor="middle" dy="${size * 0.2}">V</text>
    </svg>
  `;
  
  const outputPath = path.join(iconsDir, `icon-${size}.png`);
  
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated ${outputPath}`);
};

(async () => {
  try {
    // Ensure icons directory exists
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    await createIcon(192);
    await createIcon(512);
    
    console.log('✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
})();
