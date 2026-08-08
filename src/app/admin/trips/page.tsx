import type { Metadata } from "next";

import { TripManager } from "@/app/admin/trips/trip-manager";
import { getTripsWithTotals } from "@/lib/data";

// Reads the ledger per request; never prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trips",
};


export default async function AdminTripsPage() {
  const trips = await getTripsWithTotals();

  return <TripManager trips={trips} />;
}
