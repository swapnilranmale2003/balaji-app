import type { Metadata } from "next";

import { TripManager } from "@/app/admin/trips/trip-manager";
import { getTripsWithTotals } from "@/lib/data";

export const metadata: Metadata = {
  title: "Trips",
};


export default async function AdminTripsPage() {
  const trips = await getTripsWithTotals();

  return <TripManager trips={trips} />;
}
