import { redirect } from "next/navigation";
import { deriveValidationState } from "@/lib/validation/state";

export default function Home() {
  const { primaryRoute } = deriveValidationState();
  redirect(primaryRoute);
}
