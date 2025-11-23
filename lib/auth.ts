// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export { authOptions };
export type { NextAuthOptions };
