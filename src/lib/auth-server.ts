import { betterAuth } from "better-auth";
import { neon } from "@neondatabase/serverless";

/**
 * Server-side auth instance.
 * Uses Neon Auth endpoint — users stored in neon_auth schema.
 *
 * After auth, we link the neon_auth user to our core.users table
 * via auth_user_id.
 */
export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
  database: {
    type: "postgres",
    url: process.env.DATABASE_URL!,
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});
