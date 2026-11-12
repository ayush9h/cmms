import { RejectionForm } from "@/components/rejections/rejection-form";

export const metadata = { title: "Log production & rejection" };

export default async function Page({ searchParams }: any) {
  const { edit } = await searchParams;
  return (
    <RejectionForm
      edit={typeof edit === "string" && /^\d+$/.test(edit) ? edit : undefined}
    />
  );
}
