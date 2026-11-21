import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/dal";
import { getSettingsPageData } from "@/features/settings/services/settings-service";
import { listTemplates } from "@/features/qr/services/qr-service";
import { DeleteAccountCard, PasswordForm, ProfileForm, SessionsCard } from "@/features/settings/components/account-forms";
import { PrivacyForm } from "@/features/settings/components/privacy-form";
import { DomainsCard } from "@/features/settings/components/domains-card";
import { SavedStylesCard } from "@/features/settings/components/saved-styles-card";
import { AppearanceCard } from "@/features/settings/components/appearance-card";

export const metadata: Metadata = { title: "Settings" };

const SECTIONS = [
  ["profile", "Profile"],
  ["password", "Password"],
  ["appearance", "Appearance"],
  ["privacy", "Privacy"],
  ["domains", "Domains"],
  ["styles", "Saved styles"],
  ["sessions", "Sessions"],
  ["danger", "Delete account"],
] as const;

export default async function SettingsPage() {
  const user = await requireUser();
  const [data, templates] = await Promise.all([getSettingsPageData(user.id), listTemplates(user.id)]);
  const appHost = (() => { try { return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname; } catch { return "your-app-host"; } })();

  return (
    <>
      <PageHeader title="Settings" description="Manage your account, privacy and branded domains." />
      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label="Settings sections">
          <ul className="sticky top-20 grid gap-0.5 text-sm">
            {SECTIONS.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">{label}</a></li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-6">
          <ProfileForm name={data.user.name} email={data.user.email} />
          <PasswordForm />
          <AppearanceCard />
          <PrivacyForm initial={data.settings} />
          <DomainsCard domains={data.domains} appHost={appHost} />
          <SavedStylesCard templates={templates} />
          <SessionsCard count={data.sessions} />
          <DeleteAccountCard />
        </div>
      </div>
    </>
  );
}
