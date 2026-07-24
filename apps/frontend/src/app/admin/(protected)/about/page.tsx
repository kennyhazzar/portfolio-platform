import { getAboutAdmin } from "@/entities/about/admin-api";
import { getFilesByExternalId } from "@/entities/file/admin-api";
import { AboutForm } from "@/widgets/admin/about-form";

export default async function AdminAboutPage() {
  const about = await getAboutAdmin();
  const files = about ? await getFilesByExternalId("PUBLIC", about.id) : [];
  const photo = files.find((f) => f.type === "IMAGE") ?? null;
  const resume = files.find((f) => f.type === "DOCUMENT") ?? null;

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Обо мне</h1>
      {about && <AboutForm initial={about} initialPhoto={photo} initialResume={resume} />}
    </div>
  );
}
