"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createIncome, updateIncome } from "@/app/actions/income";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { IncomeRecord } from "@/lib/data";
import { toDateInputValue } from "@/lib/utils";
import { incomeSchema, type IncomeInput } from "@/lib/validations";

type IncomeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; omitted when adding. */
  income?: IncomeRecord | null;
};

export function IncomeDialog({ open, onOpenChange, income }: IncomeDialogProps) {
  const isEditing = Boolean(income);

  const form = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      description: "",
      date: toDateInputValue(new Date()),
    },
  });

  // The dialog stays mounted between openings, so reset the fields each time
  // it opens to match the record being edited (or a blank form when adding).
  React.useEffect(() => {
    if (!open) return;

    form.reset(
      income
        ? {
            amount: income.amount,
            description: income.description,
            date: toDateInputValue(income.date),
          }
        : {
            amount: undefined as unknown as number,
            description: "",
            date: toDateInputValue(new Date()),
          },
    );
  }, [open, income, form]);

  const onSubmit = async (values: IncomeInput) => {
    const result = income
      ? await updateIncome(income.id, values)
      : await createIncome(values);

    if (!result.success) {
      // Surface server-side field errors on the matching inputs.
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            form.setError(field as keyof IncomeInput, { message: messages[0] });
          }
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Income updated" : "Income added");
    onOpenChange(false);
  };

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Income" : "Add Received Amount"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this contribution."
              : "Record funds received into the team pool."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    {/* No `min`/`step` attributes: native constraint
                        validation would block submit before Zod runs, so the
                        user would see no error message at all. */}
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="10000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Team Collection"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Save changes" : "Add income"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
