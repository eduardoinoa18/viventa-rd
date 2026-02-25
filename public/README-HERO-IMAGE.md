# Hero Background Image Setup

## Required Action

The homepage hero section expects a background image at:
`/public/hero-dr-luxury.jpg`

## Recommended Image Specs

- **Subject:** Luxury Dominican Republic property (modern apartment, beach villa, or Santo Domingo skyline)
- **Resolution:** 1920x1080px minimum (2560x1440px recommended for retina displays)
- **Format:** JPG (optimized for web, < 300KB)
- **Style:** High quality, well-lit, aspirational
- **Orientation:** Landscape

## Where to Find Images

### Free Options
1. **Unsplash:** Search "santo domingo luxury" or "punta cana resort"
2. **Pexels:** Search "dominican republic architecture"
3. **Pixabay:** Search "caribbean luxury home"

### Paid Options (Higher Quality)
1. **Shutterstock:** "Dominican Republic real estate luxury"
2. **Adobe Stock:** "Santo Domingo modern apartment"
3. **Getty Images:** "Punta Cana villa"

## Fallback

If no image is available immediately, the hero section will display with gradient background only (still looks good, but less impactful).

## Installation

1. Download/purchase suitable image
2. Optimize with TinyPNG or similar (target < 300KB)
3. Rename to `hero-dr-luxury.jpg`
4. Place in `/public` directory
5. Verify image loads at `http://localhost:3000/hero-dr-luxury.jpg`

## Future Enhancement

Consider adding:
- Multiple hero images (rotate on page load)
- WebP format for better compression
- Lazy loading for mobile performance
