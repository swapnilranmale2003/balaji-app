import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TripDetail } from "@/app/admin/trips/[id]/trip-detail";
import { getTripWithExpenses } from "@/lib/data";


type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getTripWithExpenses(id);

  return { title: result ? result.trip.name : "Trip not found" };
}

export default async function AdminTripDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getTripWithExpenses(id);

  if (!result) notFound();

  return <TripDetail trip={result.trip} expenses={result.expenses} />;
}
