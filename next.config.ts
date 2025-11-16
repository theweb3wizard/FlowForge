
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const blockdagRpcUrl = process.env.NEXT_PUBLIC_BLOCKDAG_RPC_URL;
    if (!blockdagRpcUrl) {
      console.warn('NEXT_PUBLIC_BLOCKDAG_RPC_URL is not set, RPC proxy will not be available.');
      return [];
    }
    return [
      {
        source: '/api/rpc',
        destination: blockdagRpcUrl,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
