'use client';

import EntityLanding from "../components/EntityLanding";
import { ENTITIES } from "../lib/entities";

export default function SafeKryptePage() {
  const config = ENTITIES.find(e => e.id === "safekrypte")!;
  return <EntityLanding config={config} />;
}
