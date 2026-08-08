import type { Metadata } from "next";
import Image from "next/image";
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
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src="/team.jpg"
          alt="The Balaji Yatra team"
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute right-0 bottom-0 left-0 p-10 text-white">
          <p className="text-2xl font-semibold tracking-tight">
            Balaji Yatra Company
          </p>
          <p className="mt-1 text-sm text-white/80">
            Every rupee accounted for, openly.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to public view
          </Link>

          <div className="relative mb-6 h-36 w-full overflow-hidden rounded-lg lg:hidden">
            <Image
              src="/team.jpg"
              alt="The Balaji Yatra team"
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>

          <div className="mb-6 flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <Wallet className="size-5" />
            </span>
            <div>
              <h1 className="leading-tight font-semibold">Balaji Yatra</h1>
              <p className="text-muted-foreground text-xs">Expense Tracker</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold tracking-tight">Admin Login</h2>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">
            Sign in to manage trips and expenses.
          </p>

          <LoginForm redirectTo={from} />
        </div>
      </div>
    </div>
  );
}
