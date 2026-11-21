import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Reset your password" description="Enter your account email and we'll send you a reset link." />
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link href="/login" className="font-medium text-foreground hover:underline">Back to sign in</Link>
      </p>
    </>
  );
}
