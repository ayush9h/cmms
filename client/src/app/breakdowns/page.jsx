import { BreakdownLog } from "@/components/breakdowns/breakdown-log";

export const metadata = { title: "Breakdowns" };

export default async function Page({ searchParams }) {
  const { logged } = await searchParams;
  return <BreakdownLog logged={typeof logged === "string" ? logged : undefined} />;
}
