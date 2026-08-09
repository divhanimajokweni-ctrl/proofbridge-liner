import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/ive/workspace/Workspace";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  return <Workspace />;
}
