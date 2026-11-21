"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { verifySecret, getDummyHash } from "@/lib/auth/crypto";
import { RATE_LIMITS, rateLimit } from "@/lib/security/rate-limit";
import { getClientIpFromHeaders } from "@/lib/security/request";
import { checkDestinationUrl } from "@/lib/validations/url";
import { fail, type ActionResult } from "@/types/actions";
import { recordClick } from "@/features/analytics/services/track";
import { appHostList, getLinkPasswordHash } from "./services/redirect-service";

const schema = z.object({ slug: z.string().min(1).max(50), password: z.string().min(1, "Enter the password").max(128) });

/** Verify a protected link's password, record the click and redirect to the destination. */
export async function unlockLinkAction(input: z.input<typeof schema>): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("Enter the password");
  const h = await headers();
  const ip = getClientIpFromHeaders(h);
  const limit = rateLimit(`unlock:${ip}:${parsed.data.slug}`, RATE_LIMITS.linkUnlock);
  if (!limit.ok) return fail(`Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`);

  const link = await getLinkPasswordHash(parsed.data.slug);
  const valid = await verifySecret(parsed.data.password, link?.passwordHash ?? (await getDummyHash()));
  if (!link || !link.passwordHash || !valid) return fail("Incorrect password");
  if (!link.isActive || (link.expiresAt && link.expiresAt <= new Date())) redirect("/link-unavailable?reason=disabled");

  const appHosts = appHostList();
  const check = checkDestinationUrl(link.destinationUrl, { appHosts });
  if (!check.ok) redirect("/link-unavailable?reason=blocked");

  const requestHeaders = new Headers(h);
  after(() =>
    recordClick(requestHeaders, {
      linkId: link.id,
      collectCountry: link.user.settings?.collectCountry ?? true,
      collectReferrer: false,
      ownHosts: appHosts,
    }).catch((error) => console.error("[analytics] failed to record click", error)),
  );
  redirect(check.url);
}
