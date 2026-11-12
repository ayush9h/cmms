import { RejectionLog } from "@/components/rejections/rejection-log";

export const metadata = { title: "Production & rejection" };

export default async function Page({ searchParams }: any) {
  const { logged } = await searchParams;
  return (
    <RejectionLog logged={typeof logged === "string" ? logged : undefined} />
  );
}
