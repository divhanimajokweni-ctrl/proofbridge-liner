'use client';

import EntityLanding from "../components/EntityLanding";
import { ENTITIES } from "../lib/entities";

export default function SafeGridPage() {
  const config = ENTITIES.find(e => e.id === "safegrid")!;
  return <EntityLanding config={config} />;
}
