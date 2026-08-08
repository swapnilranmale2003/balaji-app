import { Wallet } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6 lg:px-8">
        <p className="flex items-center gap-2">
          <Wallet className="size-4" />
          Balaji Yatra Company — Expense Tracker
        </p>
        <p>Every rupee accounted for, openly.</p>
      </div>
    </footer>
  );
}
