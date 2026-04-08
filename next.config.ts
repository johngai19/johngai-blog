import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lxunzzzdnokdqhipbmdf.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/articles/walk-out-of-norwegian-wood',
        destination: '/articles/%E8%B5%B0%E5%87%BA%E6%8C%AA%E5%A8%81%E7%9A%84%E6%A3%AE%E6%9E%97?lang=en',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
