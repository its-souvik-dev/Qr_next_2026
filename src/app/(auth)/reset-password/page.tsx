import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Choose a new password" description="You'll be signed in on this device and signed out everywhere else." />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
