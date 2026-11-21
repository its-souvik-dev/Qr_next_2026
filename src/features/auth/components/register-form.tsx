"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "../actions";
import { PasswordInput } from "./password-input";
import { useActionForm } from "./use-action-form";

export function RegisterForm() {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { pending, onSubmit } = useActionForm(form, registerAction);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FormField label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" autoFocus aria-invalid={!!errors.name} {...form.register("name")} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters with a letter and a number.">
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...form.register("password")} />
      </FormField>
      <LoadingButton type="submit" loading={pending} className="mt-2 w-full">Create account</LoadingButton>
    </form>
  );
}
