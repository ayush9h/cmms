import { AssetRegister } from "@/components/assets/asset-register";

export const metadata = { title: "Assets" };

const one = (v: any) => (typeof v === "string" ? v : undefined);

export default async function Page({ searchParams }: any) {
  const { created, updated } = await searchParams;
  return <AssetRegister created={one(created)} updated={one(updated)} />;
}
