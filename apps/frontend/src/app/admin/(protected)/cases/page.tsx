import Link from "next/link";
import { getCasesAdmin } from "@/entities/case/admin-api";
import { CaseList } from "@/widgets/admin/case-list";

export default async function AdminCasesPage() {
  const cases = await getCasesAdmin();

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Кейсы</h1>
        <Link
          href="/admin/cases/new"
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Новый кейс
        </Link>
      </div>
      <CaseList initial={cases} />
    </div>
  );
}
