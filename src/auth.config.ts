import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        // We will implement this in the main auth.ts
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
