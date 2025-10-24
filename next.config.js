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
})