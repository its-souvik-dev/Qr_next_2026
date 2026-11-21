import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Welcome back" description="Sign in to manage your QR codes and links." />
      <Suspense>
        <LoginForm />
      </Suspense>
      {/* sign-up disabled
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Max QR? <Link href="/register" className="font-medium text-foreground hover:underline">Create an account</Link>
      </p>
      */}
    </>
  );
}
