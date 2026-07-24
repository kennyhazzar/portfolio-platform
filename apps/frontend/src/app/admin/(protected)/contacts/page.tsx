import { getContactsAdmin } from "@/entities/contact/admin-api";
import { ContactList } from "@/widgets/admin/contact-list";

export default async function AdminContactsPage() {
  const contacts = await getContactsAdmin();

  return (
    <div className="mx-auto max-w-[720px] px-5 py-8 sm:px-7 sm:py-16">
      <h1 className="mb-7 text-2xl font-bold tracking-tight">Контакты</h1>
      <ContactList initial={contacts} />
    </div>
  );
}
