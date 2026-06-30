'use client';

import EntityLanding from "../components/EntityLanding";
import { ENTITIES } from "../lib/entities";

export default function EkasiPage() {
  const config = ENTITIES.find(e => e.id === "ekasi")!;
  return <EntityLanding config={config} />;
}
