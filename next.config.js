/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker
  env: {
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig

