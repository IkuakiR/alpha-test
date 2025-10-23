import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Permissions-Policy',
						value: 'geolocation=(self "http://localhost:3000")',
					},
					{
						key: 'Content-Security-Policy',
						value:
							"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' api.mapbox.com; connect-src 'self' api.mapbox.com events.mapbox.com; img-src 'self' data: blob: api.mapbox.com; style-src 'self' 'unsafe-inline' api.mapbox.com; worker-src blob:; child-src blob:;",
					},
				],
			},
		];
	},
};

export default nextConfig;
