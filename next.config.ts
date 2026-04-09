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
      {
        source: '/articles/windows10安装与配置wsl2及基于wsl2的docker环境-2',
        destination: '/articles/windows10wsl2wsl2docker',
        permanent: true,
      },
      {
        source: '/articles/windows10%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AEwsl2%E5%8F%8A%E5%9F%BA%E4%BA%8Ewsl2%E7%9A%84docker%E7%8E%AF%E5%A2%83-2',
        destination: '/articles/windows10wsl2wsl2docker',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04安装p4显卡cuda和cudnn',
        destination: '/articles/ubuntu-20-04p4cudacudnn',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04%E5%AE%89%E8%A3%85p4%E6%98%BE%E5%8D%A1cuda%E5%92%8Ccudnn',
        destination: '/articles/ubuntu-20-04p4cudacudnn',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
