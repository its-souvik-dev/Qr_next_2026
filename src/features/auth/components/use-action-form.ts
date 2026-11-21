"use client";

import { useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "@/types/actions";

/**
 * Connects a react-hook-form instance to a Server Action: maps server field errors back onto the
 * form, surfaces the top-level error as a toast and exposes a pending flag.
 */
export function useActionForm<T extends FieldValues, R>(
  form: UseFormReturn<T>,
  action: (values: T) => Promise<ActionResult<R>>,
  options: { onSuccess?: (result: Extract<ActionResult<R>, { ok: true }>) => void; successToast?: boolean } = {},
) {
  const [pending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await action(values);
      if (!result) return;
      if (result.ok) {
        if (options.successToast !== false && result.message) toast.success(result.message);
        options.onSuccess?.(result);
        return;
      }
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) form.setError(field as Path<T>, { message: messages[0] });
        }
      }
      toast.error(result.error);
    });
  });

  return { pending, onSubmit };
}
