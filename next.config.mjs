/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/location",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
