import { getNavigationItemsAdmin } from "@/entities/navigation/admin-api";
import { NavigationList } from "@/widgets/admin/navigation-list";

export default async function AdminNavigationPage() {
  const items = await getNavigationItemsAdmin();

  return (
    <div className="mx-auto max-w-[840px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Навигация</h1>
      <NavigationList initial={items} />
    </div>
  );
}
