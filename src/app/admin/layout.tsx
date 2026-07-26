import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already redirects unauthenticated visitors, but this is the
  // authoritative check — it runs on the server for every admin page.
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin />
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
