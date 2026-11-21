"use client";

import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { FormField } from "@/components/shared/form-field";
import { LoadingButton } from "@/components/shared/loading-button";
import { PasswordInput } from "@/features/auth/components/password-input";
import { unlockLinkAction } from "../unlock-action";

export function UnlockForm() {
  const { slug } = useParams<{ slug: string }>();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        start(async () => {
          const result = await unlockLinkAction({ slug, password });
          if (result && !result.ok) setError(result.error);
        });
      }}
    >
      <FormField label="Password" htmlFor="link-password" error={error}>
        <PasswordInput id="link-password" autoFocus autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormField>
      <LoadingButton type="submit" loading={pending} disabled={!password}>
        <Lock /> Continue
      </LoadingButton>
    </form>
  );
}
