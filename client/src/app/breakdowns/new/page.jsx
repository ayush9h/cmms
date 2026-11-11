import { BreakdownForm } from "@/components/breakdowns/breakdown-form";

export const metadata = { title: "Log breakdown" };

export default async function Page({ searchParams }) {
  const { edit } = await searchParams;
  return <BreakdownForm edit={typeof edit === "string" && /^\d+$/.test(edit) ? edit : undefined} />;
}
