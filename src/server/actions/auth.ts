"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/auth";

export type AuthActionResult = { error: string } | void;

export async function signup(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const name = (formData.get("name") as string | null)?.trim() || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const password_hash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { email, name, password_hash },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dossiers" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please sign in." };
    }
    throw error;
  }
}
