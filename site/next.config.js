const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

if (basePath) {
  nextConfig.basePath = basePath
  nextConfig.assetPrefix = basePath
}

module.exports = nextConfig
