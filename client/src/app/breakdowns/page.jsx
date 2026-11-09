import { BreakdownLog } from "./log";

export const metadata = { title: "Breakdowns" };

export default async function BreakdownsPage({ searchParams }) {
  const { logged } = await searchParams;
  return <BreakdownLog logged={typeof logged === "string" ? logged : undefined} />;
}
