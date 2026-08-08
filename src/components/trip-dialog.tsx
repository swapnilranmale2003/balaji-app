"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTrip, updateTrip } from "@/app/actions/trip";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TripRecord } from "@/lib/data";
import { toDateInputValue } from "@/lib/utils";
import { tripSchema, type TripInput } from "@/lib/validations";

type TripDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; omitted when adding. */
  trip?: TripRecord | null;
};

const EMPTY: TripInput = {
  name: "",
  description: "",
  received: 0,
  startDate: "",
  endDate: "",
};

export function TripDialog({ open, onOpenChange, trip }: TripDialogProps) {
  const isEditing = Boolean(trip);

  const form = useForm<TripInput>({
    resolver: zodResolver(tripSchema),
    defaultValues: EMPTY,
  });

  // The dialog stays mounted between openings, so reset the fields each time
  // it opens to match the record being edited (or a blank form when adding).
  React.useEffect(() => {
    if (!open) return;

    form.reset(
      trip
        ? {
            name: trip.name,
            description: trip.description,
            received: trip.received,
            startDate: trip.startDate ? toDateInputValue(trip.startDate) : "",
            endDate: trip.endDate ? toDateInputValue(trip.endDate) : "",
          }
        : EMPTY,
    );
  }, [open, trip, form]);

  const onSubmit = async (values: TripInput) => {
    const result = trip
      ? await updateTrip(trip.id, values)
      : await createTrip(values);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            form.setError(field as keyof TripInput, { message: messages[0] });
          }
        }
      }
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Trip updated" : "Trip created");
    onOpenChange(false);
  };

  const { isSubmitting } = form.formState;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Trip" : "Create Trip"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this trip."
              : "Create a trip, then record expenses against it."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Goa Trip 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="received"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount Received (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Funds collected for this trip. You can change this later.
                  </FormDescription>
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
                      placeholder="Annual team offsite to Goa"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEditing ? "Save changes" : "Create trip"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
