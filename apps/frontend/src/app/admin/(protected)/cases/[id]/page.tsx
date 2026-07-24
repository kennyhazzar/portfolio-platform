import { notFound } from "next/navigation";
import { getCaseAdmin } from "@/entities/case/admin-api";
import { getTechnologiesAdmin } from "@/entities/technology/admin-api";
import { getFilesByExternalId } from "@/entities/file/admin-api";
import { CaseEditor } from "@/widgets/admin/case-editor";

export default async function AdminEditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [kase, technologies] = await Promise.all([getCaseAdmin(id), getTechnologiesAdmin()]);
  if (!kase) notFound();
  const gallery = await getFilesByExternalId("PUBLIC", id);

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Редактировать кейс</h1>
      <CaseEditor initial={kase} technologies={technologies} initialGallery={gallery} />
    </div>
  );
}
