"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useActionForm } from "@/features/auth/components/use-action-form";
import { changePasswordSchema, profileSchema, type ChangePasswordInput, type ProfileInput } from "@/lib/validations/auth";
import { changePasswordAction, deleteAccountAction, signOutOtherSessionsAction, updateProfileAction } from "../actions";
import { SettingsCard } from "./settings-card";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: { name } });
  const { pending, onSubmit } = useActionForm(form, updateProfileAction, { onSuccess: () => form.reset(form.getValues()) });
  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsCard id="profile" title="Profile" description="Your account details." footer={<LoadingButton type="submit" size="sm" loading={pending} disabled={!form.formState.isDirty}>Save</LoadingButton>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
            <Input id="name" autoComplete="name" {...form.register("name")} />
          </FormField>
          <FormField label="Email" htmlFor="email" hint="Email changes aren't supported yet.">
            <Input id="email" value={email} disabled readOnly />
          </FormField>
        </div>
      </SettingsCard>
    </form>
  );
}

export function PasswordForm() {
  const form = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const { pending, onSubmit } = useActionForm(form, changePasswordAction, { onSuccess: () => form.reset() });
  const { errors } = form.formState;
  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsCard id="password" title="Password" description="Changing your password signs out your other devices." footer={<LoadingButton type="submit" size="sm" loading={pending}>Update password</LoadingButton>}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <PasswordInput id="currentPassword" autoComplete="current-password" {...form.register("currentPassword")} />
          </FormField>
          <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
            <PasswordInput id="newPassword" autoComplete="new-password" {...form.register("newPassword")} />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" {...form.register("confirmPassword")} />
          </FormField>
        </div>
      </SettingsCard>
    </form>
  );
}

export function SessionsCard({ count }: { count: number }) {
  const [pending, start] = useTransition();
  return (
    <SettingsCard
      id="sessions"
      title="Sessions"
      description={`You're signed in on ${count} device${count === 1 ? "" : "s"}.`}
      footer={
        <Button size="sm" variant="outline" disabled={pending || count <= 1} onClick={() => start(async () => { const r = await signOutOtherSessionsAction(); if (r.ok) toast.success(r.message); else toast.error(r.error); })}>
          <LogOut /> Sign out other devices
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">Sessions last 30 days and are extended while you use the app. Session tokens are stored hashed.</p>
    </SettingsCard>
  );
}

export function DeleteAccountCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  return (
    <SettingsCard
      id="danger"
      danger
      title="Delete account"
      description="Permanently delete your account, QR library, short links and analytics. Short links stop working immediately. Static QR codes you've already printed keep working."
      footer={
        <Button
          variant="destructive"
          size="sm"
          disabled={pending || confirm !== "DELETE" || !password}
          onClick={() =>
            start(async () => {
              const r = await deleteAccountAction({ password, confirm });
              if (r && !r.ok) {
                setErrors(r.fieldErrors ?? {});
                toast.error(r.error);
              }
            })
          }
        >
          Delete my account
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Password" htmlFor="del-password" error={errors.password?.[0]}>
          <PasswordInput id="del-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <FormField label={<>Type <span className="font-mono">DELETE</span> to confirm</>} htmlFor="del-confirm" error={errors.confirm?.[0]}>
          <Input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </FormField>
      </div>
    </SettingsCard>
  );
}
