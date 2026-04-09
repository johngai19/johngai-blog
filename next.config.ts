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
      {
        source: '/articles/rabbitmq和kafka，两种消息队列架构的对比',
        destination: '/articles/20220104-rabbitmqe5928cka',
        permanent: true,
      },
      {
        source: '/articles/rabbitmq%E5%92%8Ckafka%EF%BC%8C%E4%B8%A4%E7%A7%8D%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97%E6%9E%B6%E6%9E%84%E7%9A%84%E5%AF%B9%E6%AF%94',
        destination: '/articles/20220104-rabbitmqe5928cka',
        permanent: true,
      },
      {
        source: '/articles/使用群晖dsm7-0自带的任务计划更新ddns',
        destination: '/articles/20220225-e4bdbfe794a8e7be',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8%E7%BE%A4%E6%99%96dsm7-0%E8%87%AA%E5%B8%A6%E7%9A%84%E4%BB%BB%E5%8A%A1%E8%AE%A1%E5%88%92%E6%9B%B4%E6%96%B0ddns',
        destination: '/articles/20220225-e4bdbfe794a8e7be',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
