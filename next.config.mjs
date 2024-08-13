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
};

export default nextConfig;
