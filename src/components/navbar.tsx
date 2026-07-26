"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Wallet,
} from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { ModeToggle } from "@/components/mode-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/income", label: "Income", icon: ArrowDownCircle },
  { href: "/admin/expenses", label: "Expenses", icon: ArrowUpCircle },
  { href: "/admin/trips", label: "Trips", icon: MapPin },
];

/** Shown to everyone, signed in or not. */
const PUBLIC_LINKS: NavLink[] = [
  { href: "/", label: "Public View", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: MapPin },
];

export function Navbar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const links = isAdmin ? ADMIN_LINKS : [];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <Wallet className="size-5" />
          </span>
          <span className="hidden sm:inline-block">Balaji Tracker</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {PUBLIC_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors",
                (href === "/" ? pathname === "/" : pathname.startsWith(href))
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          ))}
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />

          <div className="hidden md:block">
            {isAdmin ? (
              <form action={logoutAction}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </form>
            ) : (
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                <LogIn className="size-4" />
                Admin Login
              </Link>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Wallet className="size-5" />
                  Balaji Tracker
                </SheetTitle>
              </SheetHeader>

              <nav className="grid gap-1 px-4">
                {PUBLIC_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      (href === "/" ? pathname === "/" : pathname.startsWith(href)) &&
                        "bg-accent",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(href) && "bg-accent",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t p-4">
                {isAdmin ? (
                  <form action={logoutAction}>
                    <Button type="submit" variant="outline" className="w-full">
                      <LogOut className="size-4" />
                      Log out
                    </Button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants(), "w-full")}
                  >
                    <LogIn className="size-4" />
                    Admin Login
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
