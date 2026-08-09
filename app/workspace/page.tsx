import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Workspace } from "@/components/ive/workspace/Workspace";
import { UserStateGate } from "@/components/ive/workspace/UserStateGate";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <UserStateGate>
      <Workspace />
    </UserStateGate>
  );
}
