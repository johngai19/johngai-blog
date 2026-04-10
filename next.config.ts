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
      {
        source: '/articles/《鼠疫》-当灾难降临时我们该何去何从',
        destination: '/articles/20220104-e3808ae9bca0e796',
        permanent: true,
      },
      {
        source: '/articles/%E3%80%8A%E9%BC%A0%E7%96%AB%E3%80%8B-%E5%BD%93%E7%81%BE%E9%9A%BE%E9%99%8D%E4%B8%B4%E6%97%B6%E6%88%91%E4%BB%AC%E8%AF%A5%E4%BD%95%E5%8E%BB%E4%BD%95%E4%BB%8E',
        destination: '/articles/20220104-e3808ae9bca0e796',
        permanent: true,
      },
      {
        source: '/articles/《小妇人》-爱是种惊人的力量',
        destination: '/articles/20220328-e3808ae5b08fe5a6',
        permanent: true,
      },
      {
        source: '/articles/%E3%80%8A%E5%B0%8F%E5%A6%87%E4%BA%BA%E3%80%8B-%E7%88%B1%E6%98%AF%E7%A7%8D%E6%83%8A%E4%BA%BA%E7%9A%84%E5%8A%9B%E9%87%8F',
        destination: '/articles/20220328-e3808ae5b08fe5a6',
        permanent: true,
      },
      {
        source: '/articles/基于stm32的canfd评估板程序编辑下载说明',
        destination: '/articles/20221105-e59fbae4ba8estm3',
        permanent: true,
      },
      {
        source: '/articles/%E5%9F%BA%E4%BA%8Estm32%E7%9A%84canfd%E8%AF%84%E4%BC%B0%E6%9D%BF%E7%A8%8B%E5%BA%8F%E7%BC%96%E8%BE%91%E4%B8%8B%E8%BD%BD%E8%AF%B4%E6%98%8E',
        destination: '/articles/20221105-e59fbae4ba8estm3',
        permanent: true,
      },
      {
        source: '/articles/耦合，交流耦合与直流耦合',
        destination: '/articles/20221116-e880a6e59088efbc',
        permanent: true,
      },
      {
        source: '/articles/%E8%80%A6%E5%90%88%EF%BC%8C%E4%BA%A4%E6%B5%81%E8%80%A6%E5%90%88%E4%B8%8E%E7%9B%B4%E6%B5%81%E8%80%A6%E5%90%88',
        destination: '/articles/20221116-e880a6e59088efbc',
        permanent: true,
      },
      {
        source: '/articles/西门子工控产品的特点与优势',
        destination: '/articles/20221130-e8a5bfe997a8e5ad',
        permanent: true,
      },
      {
        source: '/articles/%E8%A5%BF%E9%97%A8%E5%AD%90%E5%B7%A5%E6%8E%A7%E4%BA%A7%E5%93%81%E7%9A%84%E7%89%B9%E7%82%B9%E4%B8%8E%E4%BC%98%E5%8A%BF',
        destination: '/articles/20221130-e8a5bfe997a8e5ad',
        permanent: true,
      },
      {
        source: '/articles/关于低压电器、物联网和工业自动化，我们问了chatgpt',
        destination: '/articles/20230226-e585b3e4ba8ee4bd',
        permanent: true,
      },
      {
        source: '/articles/%E5%85%B3%E4%BA%8E%E4%BD%8E%E5%8E%8B%E7%94%B5%E5%99%A8%E3%80%81%E7%89%A9%E8%81%94%E7%BD%91%E5%92%8C%E5%B7%A5%E4%B8%9A%E8%87%AA%E5%8A%A8%E5%8C%96%EF%BC%8C%E6%88%91%E4%BB%AC%E9%97%AE%E4%BA%86chatgpt',
        destination: '/articles/20230226-e585b3e4ba8ee4bd',
        permanent: true,
      },
      {
        source: '/articles/工业互联网制造业的未来',
        destination: '/articles/20230227-e5b7a5e4b89ae4ba',
        permanent: true,
      },
      {
        source: '/articles/%E5%B7%A5%E4%B8%9A%E4%BA%92%E8%81%94%E7%BD%91%E5%88%B6%E9%80%A0%E4%B8%9A%E7%9A%84%E6%9C%AA%E6%9D%A5',
        destination: '/articles/20230227-e5b7a5e4b89ae4ba',
        permanent: true,
      },
      {
        source: '/articles/艾默生成功收购ni公司，进一步巩固全球自动化领导',
        destination: '/articles/20231011-e889bee9bb98e794',
        permanent: true,
      },
      {
        source: '/articles/%E8%89%BE%E9%BB%98%E7%94%9F%E6%88%90%E5%8A%9F%E6%94%B6%E8%B4%ADni%E5%85%AC%E5%8F%B8%EF%BC%8C%E8%BF%9B%E4%B8%80%E6%AD%A5%E5%B7%A9%E5%9B%BA%E5%85%A8%E7%90%83%E8%87%AA%E5%8A%A8%E5%8C%96%E9%A2%86%E5%AF%BC',
        destination: '/articles/20231011-e889bee9bb98e794',
        permanent: true,
      },
      {
        source: '/articles/chrome解决http自动跳转https问题',
        destination: '/articles/chromehttphttps',
        permanent: true,
      },
      {
        source: '/articles/chrome%E8%A7%A3%E5%86%B3http%E8%87%AA%E5%8A%A8%E8%B7%B3%E8%BD%AChttps%E9%97%AE%E9%A2%98',
        destination: '/articles/chromehttphttps',
        permanent: true,
      },
      {
        source: '/articles/chrome%e8%a7%a3%e5%86%b3http%e8%87%aa%e5%8a%a8%e8%b7%b3%e8%bd%achttps%e9%97%ae%e9%a2%98',
        destination: '/articles/chromehttphttps',
        permanent: true,
      },
      {
        source: '/articles/labview常用技巧：2-使用通道传递数据',
        destination: '/articles/20231011-labviewe5b8b8e79',
        permanent: true,
      },
      {
        source: '/articles/labview%E5%B8%B8%E7%94%A8%E6%8A%80%E5%B7%A7%EF%BC%9A2-%E4%BD%BF%E7%94%A8%E9%80%9A%E9%81%93%E4%BC%A0%E9%80%92%E6%95%B0%E6%8D%AE',
        destination: '/articles/20231011-labviewe5b8b8e79',
        permanent: true,
      },
      {
        source: '/articles/labview%e5%b8%b8%e7%94%a8%e6%8a%80%e5%b7%a7%ef%bc%9a2-%e4%bd%bf%e7%94%a8%e9%80%9a%e9%81%93%e4%bc%a0%e9%80%92%e6%95%b0%e6%8d%ae',
        destination: '/articles/20231011-labviewe5b8b8e79',
        permanent: true,
      },
      {
        source: '/articles/windows官方清理工具autoruns介绍',
        destination: '/articles/windowsautoruns',
        permanent: true,
      },
      {
        source: '/articles/windows%E5%AE%98%E6%96%B9%E6%B8%85%E7%90%86%E5%B7%A5%E5%85%B7autoruns%E4%BB%8B%E7%BB%8D',
        destination: '/articles/windowsautoruns',
        permanent: true,
      },
      {
        source: '/articles/windows%e5%ae%98%e6%96%b9%e6%b8%85%e7%90%86%e5%b7%a5%e5%85%b7autoruns%e4%bb%8b%e7%bb%8d',
        destination: '/articles/windowsautoruns',
        permanent: true,
      },
      {
        source: '/articles/vs-code-xml-显示中文乱码',
        destination: '/articles/vs-code-xml',
        permanent: true,
      },
      {
        source: '/articles/vs-code-xml-%E6%98%BE%E7%A4%BA%E4%B8%AD%E6%96%87%E4%B9%B1%E7%A0%81',
        destination: '/articles/vs-code-xml',
        permanent: true,
      },
      {
        source: '/articles/vs-code-xml-%e6%98%be%e7%a4%ba%e4%b8%ad%e6%96%87%e4%b9%b1%e7%a0%81',
        destination: '/articles/vs-code-xml',
        permanent: true,
      },
      {
        source: '/articles/使用nvm-nvm-windows安装与配置nodejs开发环境',
        destination: '/articles/nvm-nvm-windowsnodejs',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8nvm-nvm-windows%E5%AE%89%E8%A3%85%E4%B8%8E%E9%85%8D%E7%BD%AEnodejs%E5%BC%80%E5%8F%91%E7%8E%AF%E5%A2%83',
        destination: '/articles/nvm-nvm-windowsnodejs',
        permanent: true,
      },
      {
        source: '/articles/%e4%bd%bf%e7%94%a8nvm-nvm-windows%e5%ae%89%e8%a3%85%e4%b8%8e%e9%85%8d%e7%bd%aenodejs%e5%bc%80%e5%8f%91%e7%8e%af%e5%a2%83',
        destination: '/articles/nvm-nvm-windowsnodejs',
        permanent: true,
      },
      {
        source: '/articles/工业物联网技术在智慧能源系统中的应用',
        destination: '/articles/20220104-e5b7a5e4b89ae789',
        permanent: true,
      },
      {
        source: '/articles/%E5%B7%A5%E4%B8%9A%E7%89%A9%E8%81%94%E7%BD%91%E6%8A%80%E6%9C%AF%E5%9C%A8%E6%99%BA%E6%85%A7%E8%83%BD%E6%BA%90%E7%B3%BB%E7%BB%9F%E4%B8%AD%E7%9A%84%E5%BA%94%E7%94%A8',
        destination: '/articles/20220104-e5b7a5e4b89ae789',
        permanent: true,
      },
      {
        source: '/articles/%e5%b7%a5%e4%b8%9a%e7%89%a9%e8%81%94%e7%bd%91%e6%8a%80%e6%9c%af%e5%9c%a8%e6%99%ba%e6%85%a7%e8%83%bd%e6%ba%90%e7%b3%bb%e7%bb%9f%e4%b8%ad%e7%9a%84%e5%ba%94%e7%94%a8',
        destination: '/articles/20220104-e5b7a5e4b89ae789',
        permanent: true,
      },
      {
        source: '/articles/通过labview创建与调用动态链接库-dll文件',
        destination: '/articles/20221025-e9809ae8bf87labv',
        permanent: true,
      },
      {
        source: '/articles/%E9%80%9A%E8%BF%87LabVIEW%E5%88%9B%E5%BB%BA%E4%B8%8E%E8%B0%83%E7%94%A8%E5%8A%A8%E6%80%81%E9%93%BE%E6%8E%A5%E5%BA%93-dll%E6%96%87%E4%BB%B6',
        destination: '/articles/20221025-e9809ae8bf87labv',
        permanent: true,
      },
      {
        source: '/articles/%e9%80%9a%e8%bf%87labview%e5%88%9b%e5%bb%ba%e4%b8%8e%e8%b0%83%e7%94%a8%e5%8a%a8%e6%80%81%e9%93%be%e6%8e%a5%e5%ba%93-dll%e6%96%87%e4%bb%b6',
        destination: '/articles/20221025-e9809ae8bf87labv',
        permanent: true,
      },
      {
        source: '/articles/程序员如何少写无用的代码',
        destination: '/articles/20220104-e7a88be5ba8fe591',
        permanent: true,
      },
      {
        source: '/articles/%E7%A8%8B%E5%BA%8F%E5%91%98%E5%A6%82%E4%BD%95%E5%B0%91%E5%86%99%E6%97%A0%E7%94%A8%E7%9A%84%E4%BB%A3%E7%A0%81',
        destination: '/articles/20220104-e7a88be5ba8fe591',
        permanent: true,
      },
      {
        source: '/articles/%e7%a8%8b%e5%ba%8f%e5%91%98%e5%a6%82%e4%bd%95%e5%b0%91%e5%86%99%e6%97%a0%e7%94%a8%e7%9a%84%e4%bb%a3%e7%a0%81',
        destination: '/articles/20220104-e7a88be5ba8fe591',
        permanent: true,
      },
      {
        source: '/articles/常用邮箱客户端设置指南',
        destination: '/articles/20231007-e5b8b8e794a8e982',
        permanent: true,
      },
      {
        source: '/articles/%E5%B8%B8%E7%94%A8%E9%82%AE%E7%AE%B1%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%AE%BE%E7%BD%AE%E6%8C%87%E5%8D%97',
        destination: '/articles/20231007-e5b8b8e794a8e982',
        permanent: true,
      },
      {
        source: '/articles/%e5%b8%b8%e7%94%a8%e9%82%ae%e7%ae%b1%e5%ae%a2%e6%88%b7%e7%ab%af%e8%ae%be%e7%bd%ae%e6%8c%87%e5%8d%97',
        destination: '/articles/20231007-e5b8b8e794a8e982',
        permanent: true,
      },
      {
        source: '/articles/配置vs-code进行c-开发',
        destination: '/articles/vs-codec',
        permanent: true,
      },
      {
        source: '/articles/%E9%85%8D%E7%BD%AEvs-code%E8%BF%9B%E8%A1%8Cc-%E5%BC%80%E5%8F%91',
        destination: '/articles/vs-codec',
        permanent: true,
      },
      {
        source: '/articles/%e9%85%8d%e7%bd%aevs-code%e8%bf%9b%e8%a1%8cc-%e5%bc%80%e5%8f%91',
        destination: '/articles/vs-codec',
        permanent: true,
      },
      {
        source: '/articles/%E9%85%8D%E7%BD%AEvs-code%E8%BF%9B%E8%A1%8Cc-%23-%E5%BC%80%E5%8F%91',
        destination: '/articles/vs-codec',
        permanent: true,
      },
      {
        source: '/articles/%e9%85%8d%e7%bd%aevs-code%e8%bf%9b%e8%a1%8cc-%23-%e5%bc%80%e5%8f%91',
        destination: '/articles/vs-codec',
        permanent: true,
      },
      {
        source: '/articles/windows10-wsl2限制cpu和内存',
        destination: '/articles/windows10-wsl2cpu',
        permanent: true,
      },
      {
        source: '/articles/windows10-wsl2%E9%99%90%E5%88%B6cpu%E5%92%8C%E5%86%85%E5%AD%98',
        destination: '/articles/windows10-wsl2cpu',
        permanent: true,
      },
      {
        source: '/articles/windows10-wsl2%e9%99%90%e5%88%b6cpu%e5%92%8c%e5%86%85%e5%ad%98',
        destination: '/articles/windows10-wsl2cpu',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04离线安装docker-社区版',
        destination: '/articles/ubuntu-20-04docker',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04%E7%A6%BB%E7%BA%BF%E5%AE%89%E8%A3%85docker-%E7%A4%BE%E5%8C%BA%E7%89%88',
        destination: '/articles/ubuntu-20-04docker',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04%e7%a6%bb%e7%ba%bf%e5%ae%89%e8%a3%85docker-%e7%a4%be%e5%8c%ba%e7%89%88',
        destination: '/articles/ubuntu-20-04docker',
        permanent: true,
      },
      {
        source: '/articles/群晖dsm7安装ipkg包管理器及第三方社区安装包步骤',
        destination: '/articles/20220327-e7bea4e69996dsm7',
        permanent: true,
      },
      {
        source: '/articles/%E7%BE%A4%E6%99%96dsm7%E5%AE%89%E8%A3%85ipkg%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8%E5%8F%8A%E7%AC%AC%E4%B8%89%E6%96%B9%E7%A4%BE%E5%8C%BA%E5%AE%89%E8%A3%85%E5%8C%85%E6%AD%A5%E9%AA%A4',
        destination: '/articles/20220327-e7bea4e69996dsm7',
        permanent: true,
      },
      {
        source: '/articles/%e7%be%a4%e6%99%96dsm7%e5%ae%89%e8%a3%85ipkg%e5%8c%85%e7%ae%a1%e7%90%86%e5%99%a8%e5%8f%8a%e7%ac%ac%e4%b8%89%e6%96%b9%e7%a4%be%e5%8c%ba%e5%ae%89%e8%a3%85%e5%8c%85%e6%ad%a5%e9%aa%a4',
        destination: '/articles/20220327-e7bea4e69996dsm7',
        permanent: true,
      },
      {
        source: '/articles/使用javascript递归计算fibonacci（斐波那契）数列',
        destination: '/articles/javascriptfibonacci',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8javascript%E9%80%92%E5%BD%92%E8%AE%A1%E7%AE%97fibonacci%EF%BC%88%E6%96%90%E6%B3%A2%E9%82%A3%E5%A5%91%EF%BC%89%E6%95%B0%E5%88%97',
        destination: '/articles/javascriptfibonacci',
        permanent: true,
      },
      {
        source: '/articles/%e4%bd%bf%e7%94%a8javascript%e9%80%92%e5%bd%92%e8%ae%a1%e7%ae%97fibonacci%ef%bc%88%e6%96%90%e6%b3%a2%e9%82%a3%e5%a5%91%ef%bc%89%e6%95%b0%e5%88%97',
        destination: '/articles/javascriptfibonacci',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8javascript%E9%80%92%E5%BD%92%E8%AE%A1%E7%AE%97fibonacci%EF%BC%88%E6%96%90%E6%B3%A2%E9%82%A3%E5%A5%91%EF%BC%89%E6%95%B0%E5%88%97%E5%92%8C%E9%98%B6%E4%B9%98',
        destination: '/articles/javascriptfibonacci',
        permanent: true,
      },
      {
        source: '/articles/%e4%bd%bf%e7%94%a8javascript%e9%80%92%e5%bd%92%e8%ae%a1%e7%ae%97fibonacci%ef%bc%88%e6%96%90%e6%b3%a2%e9%82%a3%e5%a5%91%ef%bc%89%e6%95%b0%e5%88%97%e5%92%8C%e9%98%b6%e4%b9%98',
        destination: '/articles/javascriptfibonacci',
        permanent: true,
      },
      {
        source: '/articles/Nodejs-Commonjs和ECMAScript-ESM模块系统导出与导入',
        destination: '/articles/nodejs-commonjsecmascript-esm',
        permanent: true,
      },
      {
        source: '/articles/Nodejs-Commonjs%E5%92%8CECMAScript-ESM%E6%A8%A1%E5%9D%97%E7%B3%BB%E7%BB%9F%E5%AF%BC%E5%87%BA%E4%B8%8E%E5%AF%BC%E5%85%A5',
        destination: '/articles/nodejs-commonjsecmascript-esm',
        permanent: true,
      },
      {
        source: '/articles/nodejs-commonjs%E5%92%8Cecmascriptesm%E6%A8%A1%E5%9D%97%E7%B3%BB%E7%BB%9F%E5%AF%BC%E5%87%BA%E4%B8%8E%E5%AF%BC%E5%85%A5',
        destination: '/articles/nodejs-commonjsecmascript-esm',
        permanent: true,
      },
      {
        source: '/articles/nodejs-commonjs%25e5%2592%258cecmascriptesm%25e6%25a8%25a1%25e5%259d%2597%25e7%25b3%25bb%25e7%25bb%259f%25e5%25af%25bc%25e5%2587%25ba%25e4%25b8%258e%25e5%25af%25bc%25e5%2585%25a5',
        destination: '/articles/nodejs-commonjsecmascript-esm',
        permanent: true,
      },
      {
        source: '/articles/使用qt模板新建命令行项目并读取输入',
        destination: '/articles/20221106-e4bdbfe794a8qte6',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8qt%E6%A8%A1%E6%9D%BF%E6%96%B0%E5%BB%BA%E5%91%BD%E4%BB%A4%E8%A1%8C%E9%A1%B9%E7%9B%AE%E5%B9%B6%E8%AF%BB%E5%8F%96%E8%BE%93%E5%85%A5',
        destination: '/articles/20221106-e4bdbfe794a8qte6',
        permanent: true,
      },
      {
        source: '/articles/%e4%bd%bf%e7%94%a8qt%e6%a8%a1%e6%9d%bf%e6%96%b0%e5%bb%ba%e5%91%bd%e4%bb%a4%e8%a1%8c%e9%a1%b9%e7%9b%ae%e5%b9%b6%e8%af%bb%e5%8f%96%e8%be%93%e5%85%a5',
        destination: '/articles/20221106-e4bdbfe794a8qte6',
        permanent: true,
      },
      {
        source: '/articles/使用c-net的mailkit库发送smtp邮件',
        destination: '/articles/c-netmailkitsmtp',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8c-net%E7%9A%84mailkit%E5%BA%93%E5%8F%91%E9%80%81smtp%E9%82%AE%E4%BB%B6',
        destination: '/articles/c-netmailkitsmtp',
        permanent: true,
      },
      {
        source: '/articles/%e4%bd%bf%e7%94%a8c-net%e7%9a%84mailkit%e5%ba%93%e5%8f%91%e9%80%81smtp%e9%82%ae%e4%bb%b6',
        destination: '/articles/c-netmailkitsmtp',
        permanent: true,
      },
      {
        source: '/articles/使用c创建并调用动态链接库dll',
        destination: '/articles/20221031-e4bdbfe794a8ce58',
        permanent: true,
      },
      {
        source: '/articles/%E4%BD%BF%E7%94%A8c%E5%88%9B%E5%BB%BA%E5%B9%B6%E8%B0%83%E7%94%A8%E5%8A%A8%E6%80%81%E9%93%BE%E6%8E%A5%E5%BA%93dll',
        destination: '/articles/20221031-e4bdbfe794a8ce58',
        permanent: true,
      },
      {
        source: '/articles/%e4%bd%bf%e7%94%a8c%e5%88%9b%e5%bb%ba%e5%b9%b6%e8%b0%83%e7%94%a8%e5%8a%a8%e6%80%81%e9%93%be%e6%8e%a5%e5%ba%93dll',
        destination: '/articles/20221031-e4bdbfe794a8ce58',
        permanent: true,
      },
      {
        source: '/articles/人工智能技术在高速公路分布式能源系统中的应用',
        destination: '/articles/20220113-e4babae5b7a5e699',
        permanent: true,
      },
      {
        source: '/articles/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%E6%8A%80%E6%9C%AF%E5%9C%A8%E9%AB%98%E9%80%9F%E5%85%AC%E8%B7%AF%E5%88%86%E5%B8%83%E5%BC%8F%E8%83%BD%E6%BA%90%E7%B3%BB%E7%BB%9F%E4%B8%AD%E7%9A%84%E5%BA%94%E7%94%A8',
        destination: '/articles/20220113-e4babae5b7a5e699',
        permanent: true,
      },
      {
        source: '/articles/%e4%ba%ba%e5%b7%a5%e6%99%ba%e8%83%bd%e6%8a%80%e6%9c%af%e5%9c%a8%e9%ab%98%e9%80%9f%e5%85%ac%e8%b7%af%e5%88%86%e5%b8%83%e5%bc%8f%e8%83%bd%e6%ba%90%e7%b3%bb%e7%bb%9f%e4%b8%ad%e7%9a%84%e5%ba%94%e7%94%A8',
        destination: '/articles/20220113-e4babae5b7a5e699',
        permanent: true,
      },
      {
        source: '/articles/Ubuntu-20.04安装XRDP远程桌面服务及xfce轻量桌面',
        destination: '/articles/ubuntu-20-04xrdpxfce',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04安装xrdp远程桌面服务及xfce轻量桌面',
        destination: '/articles/ubuntu-20-04xrdpxfce',
        permanent: true,
      },
      {
        source: '/articles/Ubuntu-20.04%E5%AE%89%E8%A3%85XRDP%E8%BF%9C%E7%A8%8B%E6%A1%8C%E9%9D%A2%E6%9C%8D%E5%8A%A1%E5%8F%8Axfce%E8%BD%BB%E9%87%8F%E6%A1%8C%E9%9D%A2',
        destination: '/articles/ubuntu-20-04xrdpxfce',
        permanent: true,
      },
      {
        source: '/articles/ubuntu-20-04%e5%ae%89%e8%a3%85xrdp%e8%bf%9c%e7%a8%8b%e6%a1%8c%e9%9d%a2%e6%9c%8d%e5%8a%a1%e5%8f%8axfce%e8%bd%bb%e9%87%8f%e6%a1%8c%e9%9d%a2',
        destination: '/articles/ubuntu-20-04xrdpxfce',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
