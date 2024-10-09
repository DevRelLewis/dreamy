/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY,
        OPENAI_API_KEY: "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",
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        API_URL: process.env.API_URL
      },
};

export default nextConfig;
