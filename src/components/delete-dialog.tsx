"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ActionResult } from "@/lib/validations";

type DeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  /** Runs on confirm; the dialog closes only when it succeeds. */
  onConfirm: () => Promise<ActionResult<null>>;
  successMessage: string;
};

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  successMessage,
}: DeleteDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async (event: React.MouseEvent) => {
    // Keep the dialog open until the server responds, so a failure can be
    // reported in place instead of vanishing with the dialog.
    event.preventDefault();
    setIsPending(true);

    try {
      const result = await onConfirm();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(successMessage);
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
