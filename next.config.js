import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'bases.mikecebul.dev',
        port: '',
        protocol: 'https',
      },
      {
        hostname: 'localhost',
        port: '3000',
        protocol: 'http',
      },
      {
        hostname: process.env.NEXT_PUBLIC_SERVER_URL.replace(/https?:\/\//, ''),
        port: '',
        protocol: 'https',
      },
    ],
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig)
