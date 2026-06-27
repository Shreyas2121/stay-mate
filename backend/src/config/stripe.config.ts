import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  frontendUrl: process.env.FRONTEND_URL!,
}));

export type StripeConfig = ReturnType<typeof stripeConfig>;
