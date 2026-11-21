"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "../actions";
import { PasswordInput } from "./password-input";
import { useActionForm } from "./use-action-form";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? undefined;
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const { pending, onSubmit } = useActionForm(form, (values) => loginAction({ ...values, next }));
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={!!errors.email} {...form.register("email")} />
      </FormField>
      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        action={<Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>}
      >
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </FormField>
      <LoadingButton type="submit" loading={pending} className="mt-2 w-full">Sign in</LoadingButton>
    </form>
  );
}
