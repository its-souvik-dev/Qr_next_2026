import { redirect } from "next/navigation";

/*
 * Sign-up is disabled (see SIGNUP_ENABLED in src/config/site.ts).
 * Original page kept below — restore it (and the links marked "sign-up disabled") to re-enable.
 *
 * import type { Metadata } from "next";
 * import Link from "next/link";
 * import { RegisterForm } from "@/features/auth/components/register-form";
 * import { AuthHeading } from "@/features/auth/components/auth-heading";
 *
 * export const metadata: Metadata = { title: "Create account" };
 *
 * export default function RegisterPage() {
 *   return (
 *     <>
 *       <AuthHeading title="Create your account" description="Design QR codes, shorten links and track clicks — free." />
 *       <RegisterForm />
 *       <p className="mt-6 text-center text-sm text-muted-foreground">
 *         Already have an account? <Link href="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
 *       </p>
 *     </>
 *   );
 * }
 */

export default function RegisterPage() {
  redirect("/login");
}
