/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'sa-golf-rankings.vercel.app' }],
        destination: 'https://pinhigh.co.za/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
