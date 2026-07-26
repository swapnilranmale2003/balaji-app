import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
        <FileQuestion className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          The page you are looking for does not exist.
        </p>
      </div>
      <Button render={<Link href="/" />}>Back to home</Button>
    </div>
  );
}
