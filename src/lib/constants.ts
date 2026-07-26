import type { LucideIcon } from "lucide-react";
import { Bus, CalendarDays, Hotel, Package, UtensilsCrossed } from "lucide-react";

/** Default expense categories. */
export const CATEGORIES = [
  "Food",
  "Travel",
  "Stay",
  "Event",
  "Miscellaneous",
] as const;

export type Category = (typeof CATEGORIES)[number];

type CategoryMeta = {
  icon: LucideIcon;
  /** Tailwind classes for the category badge, tuned for light and dark mode. */
  className: string;
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: {
    icon: UtensilsCrossed,
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  Travel: {
    icon: Bus,
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  Stay: {
    icon: Hotel,
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  Event: {
    icon: CalendarDays,
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  Miscellaneous: {
    icon: Package,
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  },
};

/** Falls back gracefully if a row holds a category no longer in the list. */
export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category as Category] ?? CATEGORY_META.Miscellaneous;
}

/** Rows shown per page in the public and admin tables. */
export const PAGE_SIZE = 10;
