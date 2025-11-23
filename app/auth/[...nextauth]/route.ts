// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const runtime = "nodejs"; // <-- avoid Edge

export const authOptions: NextAuthOptions = {
  debug: true,                   // <-- log errors to server console
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      authorize: async () => null, // keep simple; session route should still work
    }),
  ],
  logger: {
    error(code, metadata) {
      console.error("NextAuth error:", code, metadata);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
