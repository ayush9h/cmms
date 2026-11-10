import { Oee } from "@/components/oee/oee";

export const metadata = { title: "OEE" };

export default async function Page({ searchParams }) {
  const { logged } = await searchParams;
  return <Oee logged={typeof logged === "string" ? logged : undefined} />;
}
