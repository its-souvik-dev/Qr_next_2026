import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/shared/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Brand />
      <div>
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      </div>
      <Button asChild><Link href="/">Go home</Link></Button>
    </div>
  );
}
