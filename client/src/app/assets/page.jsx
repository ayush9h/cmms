import { AssetRegister } from "@/components/assets/asset-register";

export const metadata = { title: "Assets" };

export default async function Page({ searchParams }) {
  const { created } = await searchParams;
  return <AssetRegister created={typeof created === "string" ? created : undefined} />;
}
