import { Register } from "./register";

export const metadata = { title: "Assets" };

export default async function AssetsPage({ searchParams }) {
  const { created } = await searchParams;
  return <Register created={typeof created === "string" ? created : undefined} />;
}
