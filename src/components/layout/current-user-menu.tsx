import { requireUser } from "@/lib/auth/dal";
import { UserMenu } from "./user-menu";

export async function CurrentUserMenu() {
  const user = await requireUser();
  return <UserMenu name={user.name} email={user.email} />;
}
