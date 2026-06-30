'use client';

import EntityLanding from "../../components/EntityLanding";
import { ENTITIES } from "../../lib/entities";

export default function LindiwePage() {
  const config = ENTITIES.find(e => e.id === "lindiwe")!;
  return <EntityLanding config={config} />;
}
