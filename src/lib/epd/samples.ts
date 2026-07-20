// Sample .epd policies used for seeding and the CLI demo files.

export const SAMPLE_POLICIES: { name: string; filename: string; source: string }[] = [
  {
    name: "Smart Grid Frequency Stability",
    filename: "grid-frequency.epd",
    source: `# Smart Grid — frequency & energy-balance invariants
# Sharded by geographic region with locality-preserving merges.

policy "grid_frequency_stability" {
  description "Maintain grid frequency and energy balance across all regions"
  domain "smart_grid"
  version "1.0.0"

  shard by region {
    key "geo_region"
    strategy locality_preserving
    count 6
    replication 3
  }

  invariant "freq_bounds" "Grid frequency must stay within statutory bounds" {
    predicate frequency in [49.8, 50.2]
    severity critical
    tags ["safety", "statutory"]
  }

  invariant "energy_conservation" "Generation must cover load plus losses" {
    predicate sum(generation) >= sum(load) + losses
    severity critical
  }

  soft invariant "thermal_headroom" "Keep transformer thermal headroom above 10%" {
    predicate thermal_headroom >= 10
    severity medium
  }

  expect merge {
    preserves sum(generation)
    preserves max(frequency)
    locality_preserving true
    max_divergence 0.5
  }

  on_violation {
    strategy self_repair
    objective least_divergent
    max_iters 500
    notify "grid-ops@epistemic.io"
  }

  ancestry {
    proof mmr
    zk true
    gossip p2p
    anchor rekor
  }

  shadow_bridge {
    enabled true
    takeover_latency_ms 250
    whatif_branching true
    replay true
    authoritative false
  }

  export to wasm
  export to rust
  export to tla
}
`,
  },
  {
    name: "Hospital Census Reconciliation",
    filename: "hospital-census.epd",
    source: `# Federated hospital census — privacy-preserving epistemic merge
# Two hospitals reconcile patient counts without exposing raw data (ZK).

policy "hospital_census" {
  description "Privacy-preserving epidemic census reconciliation"
  domain "public_health"
  version "0.9.0"

  shard by facility {
    key "facility_id"
    strategy hash
    replication 2
  }

  invariant "monotonic_admits" "Cumulative admissions must never decrease" {
    predicate cumulative_admits >= prev_admits
    severity high
  }

  invariant "discharge_bound" "Discharges cannot exceed admissions" {
    predicate total_discharges <= total_admits
    severity high
  }

  soft invariant "bed_ratio" "ICU bed occupancy should stay below 92%" {
    predicate icu_occupancy in [0, 92]
    severity medium
  }

  expect merge {
    preserves max(cumulative_admits)
    requires monotonic_admits
    locality_preserving true
  }

  on_violation {
    strategy self_repair
    objective max_consistency
    max_iters 200
  }

  ancestry {
    proof mmr
    zk true
    gossip mesh
    anchor transparency_log
  }

  shadow_bridge {
    enabled false
  }

  export to wasm
}
`,
  },
  {
    name: "Autonomous Fleet Safety Envelope",
    filename: "fleet-safety.epd",
    source: `# Autonomous fleet — formally guaranteed safety envelope
# Shadow bridge can hot-takeover when physical plant violates invariants.

policy "fleet_safety_envelope" {
  description "Safety envelope for autonomous vehicle fleet coordination"
  domain "autonomous_vehicles"
  version "2.1.0"

  shard by subsystem {
    key "vehicle_id"
    strategy subsystem
    count 4
    replication 3
  }

  invariant "min_separation" "Vehicles must maintain minimum separation" {
    predicate min(separation) >= 2.0
    severity critical
  }

  invariant "speed_bound" "Speed must stay within operational envelope" {
    predicate speed in [0, 120]
    severity critical
  }

  invariant "braking_energy" "Braking energy budget must be non-negative" {
    predicate braking_budget >= 0
    severity high
  }

  soft invariant "comfort_jerk" "Jerk should stay within comfort bounds" {
    predicate abs(jerk) <= 2.5
    severity low
  }

  expect merge {
    preserves min(separation)
    preserves min(braking_budget)
    locality_preserving true
    max_divergence 0.1
  }

  on_violation {
    strategy self_repair
    objective min_disruption
    max_iters 50
    notify "fleet-safety@epistemic.io"
  }

  ancestry {
    proof mmr
    zk false
    gossip p2p
    anchor blockchain
  }

  shadow_bridge {
    enabled true
    takeover_latency_ms 150
    whatif_branching true
    replay true
    authoritative true
  }

  export to wasm
  export to rust
  export to tla
}
`,
  },
  {
    name: "Cold-Chain Supply Integrity",
    filename: "cold-chain.epd",
    source: `# Cold-chain logistics — temperature integrity across the DAG
# Sharded by subsystem (producer → transporter → retailer).

policy "cold_chain_integrity" {
  description "Pharmaceutical cold-chain temperature integrity"
  domain "supply_chain"
  version "1.2.0"

  shard by subsystem {
    key "custody_stage"
    strategy subsystem
    count 3
    replication 2
  }

  invariant "temp_range" "Temperature must stay within pharmacopeia range" {
    predicate temperature in [2, 8]
    severity critical
  }

  invariant "excursion_dose" "Cumulative excursion minutes must stay bounded" {
    predicate excursion_minutes <= 30
    severity high
  }

  soft invariant "humidity_range" "Humidity should stay within recommended range" {
    predicate humidity in [35, 65]
    severity low
  }

  expect merge {
    preserves max(excursion_minutes)
    preserves min(temperature)
    locality_preserving true
  }

  on_violation {
    strategy quarantine
    objective least_divergent
    max_iters 100
  }

  ancestry {
    proof mmr
    zk false
    gossip star
    anchor rekor
  }

  shadow_bridge {
    enabled true
    takeover_latency_ms 500
    whatif_branching false
    replay true
  }

  export to wasm
}
`,
  },
  {
    name: "Financial Ledger Integrity",
    filename: "financial-ledger.epd",
    source: `# Financial double-entry ledger — conservation + monotonicity invariants
# Sharded by account region; ZK-anchored for confidential cross-org reconciliation.

policy "financial_ledger_integrity" {
  description "Double-entry conservation and monotonic audit trail"
  domain "finance"
  version "1.0.0"

  shard by region {
    key "ledger_region"
    strategy locality_preserving
    count 4
    replication 3
  }

  invariant "double_entry_conservation" "Debits must equal credits" {
    predicate sum(debits) == sum(credits)
    severity critical
    tags ["accounting", "conservation"]
  }

  invariant "non_negative_balances" "No account may go negative" {
    predicate min(balances) >= 0
    severity critical
  }

  invariant "monotonic_height" "Ledger height must never decrease" {
    predicate ledger_height >= prev_height
    severity high
  }

  soft invariant "settlement_lag" "Settlement lag should stay under 2 blocks" {
    predicate settlement_lag <= 2
    severity medium
  }

  expect merge {
    preserves sum(debits)
    preserves max(ledger_height)
    locality_preserving true
    max_divergence 0.0
  }

  on_violation {
    strategy reject
    objective max_consistency
    notify "compliance@epistemic.io"
  }

  ancestry {
    proof mmr
    zk true
    gossip mesh
    anchor blockchain
  }

  shadow_bridge {
    enabled false
  }

  export to wasm
  export to rust
}
`,
  },
  {
    name: "Water Treatment Safety Envelope",
    filename: "water-treatment.epd",
    source: `# Municipal water treatment — chemical dosing & pressure safety envelope
# Shadow bridge can hot-takeover the SCADA plant when invariants breach.

policy "water_treatment_safety" {
  description "Chemical dosing and pressure safety for municipal water treatment"
  domain "water_utility"
  version "0.8.0"

  shard by subsystem {
    key "plant_unit"
    strategy subsystem
    count 3
    replication 2
  }

  invariant "chlorine_residual" "Free chlorine residual must stay within potable bounds" {
    predicate chlorine_residual in [0.2, 4.0]
    severity critical
    tags ["safety", "potable"]
  }

  invariant "ph_range" "pH must stay within regulatory range" {
    predicate ph in [6.5, 8.5]
    severity critical
  }

  invariant "main_pressure" "Main pressure must stay below pipe burst threshold" {
    predicate main_pressure <= 8.5
    severity critical
  }

  soft invariant "turbidity" "Turbidity should stay below 1.0 NTU" {
    predicate turbidity <= 1.0
    severity medium
  }

  expect merge {
    preserves max(main_pressure)
    preserves min(chlorine_residual)
    locality_preserving true
  }

  on_violation {
    strategy self_repair
    objective min_disruption
    max_iters 30
    notify "plant-ops@epistemic.io"
  }

  ancestry {
    proof mmr
    zk false
    gossip p2p
    anchor rekor
  }

  shadow_bridge {
    enabled true
    takeover_latency_ms 120
    whatif_branching true
    replay true
    authoritative true
  }

  export to wasm
  export to tla
}
`,
  },
];

// A deliberately-broken policy used to demonstrate diagnostics.
export const BROKEN_POLICY_SOURCE = `# Demonstrates validator diagnostics
policy "broken_demo" {
  invariant "no_pred" {
    severity critical
  }

  invariant "dup" "first" {
    predicate temperature in [2, 8]
  }
  invariant "dup" "second" {
    predicate temperature in [2, 8]
  }

  shard by region {
    strategy unknown_strategy
  }

  on_violation {
    strategy self_repair
  }

  ancestry {
    proof merkle
    zk true
  }

  shadow_bridge {
    enabled true
    takeover_latency_ms 5000
  }
}
`;

// Sample shard state used for the DAG topology & merge demos.
export const SAMPLE_STATES: Record<string, Record<string, unknown>> = {
  "grid_frequency_stability": {
    geo_region: "europe-west",
    frequency: 50.01,
    generation: [420, 380, 510, 290, 600, 470],
    load: [410, 375, 500, 285, 590, 460],
    losses: 12,
    thermal_headroom: 18,
  },
  "hospital_census": {
    facility_id: "hosp-7",
    cumulative_admits: 1284,
    prev_admits: 1260,
    total_admits: 1284,
    total_discharges: 1190,
    icu_occupancy: 88,
  },
  "fleet_safety_envelope": {
    vehicle_id: "AV-042",
    separation: [3.2, 2.8, 4.1, 2.5, 5.0],
    speed: 64,
    braking_budget: 42,
    jerk: -1.8,
  },
  "cold_chain_integrity": {
    custody_stage: "transporter",
    temperature: 4.5,
    excursion_minutes: 8,
    humidity: 48,
  },
  "financial_ledger_integrity": {
    ledger_region: "emea",
    debits: [1000, 2500, 750, 3200],
    credits: [1000, 2500, 750, 3200],
    balances: [5200, 8400, 1200, 9600],
    ledger_height: 14820,
    prev_height: 14810,
    settlement_lag: 1,
  },
  "water_treatment_safety": {
    plant_unit: "plant-north",
    chlorine_residual: 1.8,
    ph: 7.2,
    main_pressure: 6.4,
    turbidity: 0.4,
  },
};

// A violating proposed state, used to demonstrate self-repair
export const VIOLATING_PROPOSED: Record<string, Record<string, unknown>> = {
  "grid_frequency_stability": {
    geo_region: "europe-west",
    frequency: 50.6,
    generation: [420, 380, 510, 290, 600, 470],
    load: [410, 375, 500, 285, 590, 460],
    losses: 12,
    thermal_headroom: 6,
  },
  "fleet_safety_envelope": {
    vehicle_id: "AV-042",
    separation: [1.2, 2.8, 4.1, 2.5, 5.0],
    speed: 134,
    braking_budget: -8,
    jerk: -3.4,
  },
  "water_treatment_safety": {
    plant_unit: "plant-north",
    chlorine_residual: 5.2,
    ph: 9.1,
    main_pressure: 9.8,
    turbidity: 1.8,
  },
};
