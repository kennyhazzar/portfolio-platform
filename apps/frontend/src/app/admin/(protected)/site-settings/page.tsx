import { getSiteSettingAdmin } from "@/entities/site-setting/admin-api";
import { getFilesByExternalId } from "@/entities/file/admin-api";
import { SiteSettingsForm } from "@/widgets/admin/site-settings-form";

export default async function AdminSiteSettingsPage() {
  const siteSetting = await getSiteSettingAdmin();
  const favicon = siteSetting
    ? (await getFilesByExternalId("PUBLIC", siteSetting.id)).find((f) => f.isCover) ?? null
    : null;

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Настройки сайта</h1>
      {siteSetting && <SiteSettingsForm initial={siteSetting} initialFavicon={favicon} />}
    </div>
  );
}
