/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'iccixrimzohdzfbgdegt.supabase.co',
            },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
