import { getTechnologiesAdmin } from "@/entities/technology/admin-api";
import { CaseEditor } from "@/widgets/admin/case-editor";

export default async function AdminNewCasePage() {
  const technologies = await getTechnologiesAdmin();

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Новый кейс</h1>
      <CaseEditor technologies={technologies} />
    </div>
  );
}
