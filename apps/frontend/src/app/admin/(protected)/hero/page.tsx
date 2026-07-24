import { getHeroAdmin } from "@/entities/hero/admin-api";
import { getFilesByExternalId } from "@/entities/file/admin-api";
import { HeroForm } from "@/widgets/admin/hero-form";

export default async function AdminHeroPage() {
  const hero = await getHeroAdmin();
  const photo = hero ? (await getFilesByExternalId("PUBLIC", hero.id)).find((f) => f.isCover) ?? null : null;

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Hero</h1>
      {hero && <HeroForm initial={hero} initialPhoto={photo} />}
    </div>
  );
}
