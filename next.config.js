/** Next.js config with PWA support */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	register: true,
	skipWaiting: true,
	sw: 'service-worker.js',
	buildExcludes: [/middleware-manifest\.json$/],
	runtimeCaching: [
		{
			urlPattern: /^https?.*\/_next\/static\/.*/i,
			handler: 'CacheFirst',
			options: {
				cacheName: 'static-resources',
				expiration: {
					maxEntries: 64,
					maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
				}
			}
		},
		{
			urlPattern: /\.(?:png|jpg|jpeg|webp|avif|svg|gif)$/i,
			handler: 'StaleWhileRevalidate',
			options: {
				cacheName: 'image-cache',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
				}
			}
		},
		{
			urlPattern: /^https?:\/\/.*\/api\/.*/i,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'api-cache',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 5 * 60 // 5 minutes
				}
			}
		}
	]
})

module.exports = withPWA({
	reactStrictMode: true,
	images: {
		formats: ['image/avif', 'image/webp'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		remotePatterns: [
			{ protocol: 'https', hostname: '**.googleusercontent.com' },
			{ protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
			{ protocol: 'https', hostname: '**.cloudinary.com' },
			{ protocol: 'https', hostname: 'images.unsplash.com' },
		],
	},
	async headers() {
		const csp = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://cdn.jsdelivr.net",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"img-src 'self' data: blob: https://*",
			"connect-src 'self' https://* wss://*",
			"font-src 'self' https://fonts.gstatic.com data:",
			"frame-src https://js.stripe.com https://hooks.stripe.com",
			"manifest-src 'self'",
		].join('; ')
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'Content-Security-Policy', value: csp },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
				],
			},
			{
				source: '/manifest.json',
				headers: [
					{ key: 'Content-Type', value: 'application/manifest+json' },
					{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
				],
			},
			{
				source: '/service-worker.js',
				headers: [
					{ key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
					{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
					{ key: 'Service-Worker-Allowed', value: '/' },
				],
			},
		]
	},
})