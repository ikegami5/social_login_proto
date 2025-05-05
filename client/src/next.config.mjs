/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        SERVER_URL: process.env.SERVER_URL
    },
    trailingSlash: true,
    output: 'export',
    images: {
        unoptimized: true
    }
};

export default nextConfig;
