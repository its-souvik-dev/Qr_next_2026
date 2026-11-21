"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { requestPasswordResetAction } from "../actions";
import { useActionForm } from "./use-action-form";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const { pending, onSubmit } = useActionForm(form, requestPasswordResetAction, {
    successToast: false,
    onSuccess: (r) => setSent(r.message ?? "Check your inbox."),
  });

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/40 p-6 text-center">
        <MailCheck className="size-6 text-success" />
        <p className="text-sm">{sent}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus {...form.register("email")} />
      </FormField>
      <LoadingButton type="submit" loading={pending} className="w-full">Send reset link</LoadingButton>
    </form>
  );
}
