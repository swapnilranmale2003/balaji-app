import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";

import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to public view
      </Link>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
          <Wallet className="size-6" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to manage the team funds.
        </p>
      </div>

      <LoginForm redirectTo={from} />
    </div>
  );
}
