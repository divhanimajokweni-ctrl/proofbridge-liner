import { redirect } from "next/navigation";
import { IveRoot } from "@/components/ive/IveRoot";
import { getClerkSession } from "@/lib/session/clerk";

/**
 * Production IVE entry point.
 *
 * The existing IveRoot is the authoritative production workspace. This route
 * deliberately renders it unchanged; the route only adds the authenticated
 * workspace boundary required for public-site → IVE navigation.
 */
export default async function WorkspacePage() {
  const session = await getClerkSession();

  if (!session?.userId) {
    redirect(`/login?redirect=${encodeURIComponent("/workspace")}`);
  }

  return <IveRoot />;
}
