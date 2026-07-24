import { LoginForm } from "@/widgets/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-7">
      <div className="flex flex-col items-center gap-2">
        <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          P
        </span>
        <h1 className="text-lg font-bold tracking-tight">Вход в админ-панель</h1>
      </div>
      <LoginForm />
    </div>
  );
}
