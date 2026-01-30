/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required headers for FFmpeg.wasm to work with SharedArrayBuffer
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless', // Use credentialless to allow cross-origin resources
          },
        ],
      },
    ];
  },
  // Webpack config for FFmpeg.wasm
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
