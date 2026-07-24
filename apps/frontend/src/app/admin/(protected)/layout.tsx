import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE, fetchCurrentUser } from "@/shared/server/auth";
import { AdminSidebar } from "@/widgets/admin/admin-sidebar";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const user = accessToken ? await fetchCurrentUser(accessToken) : null;

  // Middleware already gates every route in this tree — this redirect only covers the
  // theoretical gap between the middleware check and this render (token revoked in between).
  if (!user) redirect("/admin/login");

  const userLabel = `${user.name} ${user.surname}${user.role ? ` · ${user.role.name}` : ""}`;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar userLabel={userLabel} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
