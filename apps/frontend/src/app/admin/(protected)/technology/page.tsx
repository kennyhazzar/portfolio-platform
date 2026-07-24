import { getTechnologiesAdmin } from "@/entities/technology/admin-api";
import { TechnologyList } from "@/widgets/admin/technology-list";

export default async function AdminTechnologyPage() {
  const technologies = await getTechnologiesAdmin();

  return (
    <div className="mx-auto max-w-[720px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Технологии</h1>
      <TechnologyList initial={technologies} />
    </div>
  );
}
