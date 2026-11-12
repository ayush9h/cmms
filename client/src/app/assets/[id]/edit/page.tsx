import { EditAssetForm } from "@/components/assets/asset-form";

export const metadata = { title: "Edit asset" };

export default async function Page({ params }: any) {
  const { id } = await params;
  return <EditAssetForm assetId={decodeURIComponent(id)} />;
}
