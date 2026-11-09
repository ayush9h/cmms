import { RejectionLog } from "./log";

export const metadata = { title: "Production & rejection" };

export default async function RejectionsPage({ searchParams }) {
  const { logged } = await searchParams;
  return <RejectionLog logged={typeof logged === "string" ? logged : undefined} />;
}
