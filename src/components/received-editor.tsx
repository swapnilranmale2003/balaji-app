"use client";

import * as React from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { updateTripReceived } from "@/app/actions/trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

/**
 * Inline editor for a trip's received amount. Shows the figure as text until
 * the pencil is clicked, so the common case (reading) stays uncluttered.
 */
export function ReceivedEditor({
  tripId,
  received,
}: {
  tripId: string;
  received: number;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(String(received));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Re-sync when the server sends a new value (e.g. after another edit).
  React.useEffect(() => {
    if (!editing) setValue(String(received));
  }, [received, editing]);

  const start = () => {
    setError(null);
    setEditing(true);
    // Focus after the input has actually mounted.
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const cancel = () => {
    setValue(String(received));
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    setPending(true);
    setError(null);

    try {
      const result = await updateTripReceived(tripId, { received: value });

      if (!result.success) {
        setError(result.fieldErrors?.received?.[0] ?? result.error);
        return;
      }

      toast.success("Received amount updated");
      setEditing(false);
    } finally {
      setPending(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(received)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={start}
          aria-label="Edit received amount"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={value}
          disabled={pending}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }
            if (event.key === "Escape") cancel();
          }}
          className="h-9 w-40 text-lg font-semibold tabular-nums"
          aria-label="Received amount"
          aria-invalid={Boolean(error)}
        />
        <Button
          size="icon"
          className="size-8"
          onClick={save}
          disabled={pending}
          aria-label="Save received amount"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={cancel}
          disabled={pending}
          aria-label="Cancel"
        >
          <X className="size-4" />
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
