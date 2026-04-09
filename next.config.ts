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
      {
        source: '/articles/如何从官方地址下载google-chrome的离线安装包',
        destination: '/articles/20220207-e5a682e4bd95e4bb',
        permanent: true,
      },
      {
        source: '/articles/%E5%A6%82%E4%BD%95%E4%BB%8E%E5%AE%98%E6%96%B9%E5%9C%B0%E5%9D%80%E4%B8%8B%E8%BD%BDgoogle-chrome%E7%9A%84%E7%A6%BB%E7%BA%BF%E5%AE%89%E8%A3%85%E5%8C%85',
        destination: '/articles/20220207-e5a682e4bd95e4bb',
        permanent: true,
      },
      {
        source: '/articles/西门子博途（tia-portal）软件安装要求重启的解决办法',
        destination: '/articles/20220921-e8a5bfe997a8e5ad',
        permanent: true,
      },
      {
        source: '/articles/%E8%A5%BF%E9%97%A8%E5%AD%90%E5%8D%9A%E9%80%94%EF%BC%88tia-portal%EF%BC%89%E8%BD%AF%E4%BB%B6%E5%AE%89%E8%A3%85%E8%A6%81%E6%B1%82%E9%87%8D%E5%90%AF%E7%9A%84%E8%A7%A3%E5%86%B3%E5%8A%9E%E6%B3%95',
        destination: '/articles/20220921-e8a5bfe997a8e5ad',
        permanent: true,
      },
      {
        source: '/articles/使用edge浏览器的ie模式打开兼容网站',
        destination: '/articles/20220204-e4bdbfe794a8edge',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8edge%E6%B5%8F%E8%A7%88%E5%99%A8%E7%9A%84ie%E6%A8%A1%E5%BC%8F%E6%89%93%E5%BC%80%E5%85%BC%E5%AE%B9%E7%BD%91%E7%AB%99',
        destination: '/articles/20220204-e4bdbfe794a8edge',
        permanent: true,
      },
      {
        source: '/articles/为什么要用javascript实现人工智能',
        destination: '/articles/20220824-e4b8bae4bb80e4b9',
        permanent: true,
      },
      {
        source: '/articles/%E4%B8%BA%E4%BB%80%E4%B9%88%E8%A6%81%E7%94%A8javascript%E5%AE%9E%E7%8E%B0%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD',
        destination: '/articles/20220824-e4b8bae4bb80e4b9',
        permanent: true,
      },
      {
        source: '/articles/串口调试工具、方法和步骤',
        destination: '/articles/20221103-e4b8b2e58fa3e8b0',
        permanent: true,
      },
      {
        source: '/articles/%E4%B8%B2%E5%8F%A3%E8%B0%83%E8%AF%95%E5%B7%A5%E5%85%B7%E3%80%81%E6%96%B9%E6%B3%95%E5%92%8C%E6%AD%A5%E9%AA%A4',
        destination: '/articles/20221103-e4b8b2e58fa3e8b0',
        permanent: true,
      },
      {
        source: '/articles/爱·理想·生活-说说吕克·贝松的《subway》',
        destination: '/articles/20070606-e788b1c2b7e79086',
        permanent: true,
      },
      {
        source: '/articles/%E7%88%B1%C2%B7%E7%90%86%E6%83%B3%C2%B7%E7%94%9F%E6%B4%BB-%E8%AF%B4%E8%AF%B4%E5%90%95%E5%85%8B%C2%B7%E8%B4%9D%E6%9D%BE%E7%9A%84%E3%80%8Asubway%E3%80%8B',
        destination: '/articles/20070606-e788b1c2b7e79086',
        permanent: true,
      },
      {
        source: '/articles/了解自我与认识世界-李银河《中国女性的感情与',
        destination: '/articles/20220104-e4ba86e8a7a3e887',
        permanent: true,
      },
      {
        source: '/articles/%E4%BA%86%E8%A7%A3%E8%87%AA%E6%88%91%E4%B8%8E%E8%AE%A4%E8%AF%86%E4%B8%96%E7%95%8C-%E6%9D%8E%E9%93%B6%E6%B2%B3%E3%80%8A%E4%B8%AD%E5%9B%BD%E5%A5%B3%E6%80%A7%E7%9A%84%E6%84%9F%E6%83%85%E4%B8%8E',
        destination: '/articles/20220104-e4ba86e8a7a3e887',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
