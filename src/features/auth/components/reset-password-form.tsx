"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "../actions";
import { PasswordInput } from "./password-input";
import { useActionForm } from "./use-action-form";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const { pending, onSubmit } = useActionForm(form, resetPasswordAction);
  const { errors } = form.formState;

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        This page needs a reset token. <Link className="text-foreground underline" href="/forgot-password">Request a new link</Link>.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormField label="New password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="new-password" autoFocus {...form.register("password")} />
      </FormField>
      <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
      </FormField>
      <LoadingButton type="submit" loading={pending} className="w-full">Update password</LoadingButton>
    </form>
  );
}
