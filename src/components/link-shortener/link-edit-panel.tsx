"use client";

import { useRouter } from "next/navigation";
import { LinkForm, type LinkFormProps } from "./link-form";

export function LinkEditPanel(props: Omit<LinkFormProps, "mode" | "onDone">) {
  const router = useRouter();
  return <LinkForm {...props} mode="edit" onDone={(id) => router.replace(`/links/${id}`, { scroll: false })} />;
}
