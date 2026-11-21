import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AuthShowcase } from "@/features/auth/components/auth-showcase";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <AuthShowcase />
    </div>
  );
}
