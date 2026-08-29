import { Router } from 'express';
import { db } from '../db';

const router = Router();

// B2B CRM data — 20 industrial targets from the VVU B2B CRM Tracker
const B2B_PIPELINE = [
  { company: "Anglo American Platinum", subsector: "Mining & Minerals", facility: "Rustenburg Smelter Complex", decisionMaker: "Plant Operations Director", annualLossM3: 185000, lossValueZar: 8325000, status: "INITIAL_EMAIL_SENT", painPoint: "High-vibration furnace cooling lines" },
  { company: "Sibanye-Stillwater", subsector: "Mining & Minerals", facility: "Marikana Platinum Mine", decisionMaker: "Dewatering Infrastructure Lead", annualLossM3: 240000, lossValueZar: 10800000, status: "CLOSED_ACTIVE_PILOT", painPoint: "Deep-level high-pressure dewatering" },
  { company: "Sasol Limited", subsector: "Heavy Manufacturing", facility: "Secunda Synfuels Operations", decisionMaker: "Process Water Superintendent", annualLossM3: 310000, lossValueZar: 13950000, status: "TECHNICAL_REVIEW_SCHEDULED", painPoint: "Corrosive chemical-process loop" },
  { company: "Teraco Data Environments", subsector: "Data Centres", facility: "Isando JB1 Mega-Campus", decisionMaker: "Data Centre Facilities Director", annualLossM3: 45000, lossValueZar: 2025000, status: "INITIAL_EMAIL_SENT", painPoint: "Zero-tolerance liquid cooling loops" },
  { company: "Mondi Group", subsector: "Heavy Manufacturing", facility: "Merebank Pulp & Paper Mill", decisionMaker: "Utility Operations Manager", annualLossM3: 195000, lossValueZar: 8775000, status: "PDU_PROPOSAL_SENT", painPoint: "Abrasive steam & paper-feed piping" },
  { company: "Sappi Southern Africa", subsector: "Heavy Manufacturing", facility: "Ngodwana Pulp Mill", decisionMaker: "Facilities Director", annualLossM3: 215000, lossValueZar: 9675000, status: "NOT_CONTACTED", painPoint: "High-temperature boiler feed lines" },
  { company: "Equinix South Africa", subsector: "Data Centres", facility: "Gauteng JN1 Facility", decisionMaker: "Critical Systems Lead", annualLossM3: 35000, lossValueZar: 1575000, status: "NOT_CONTACTED", painPoint: "Precision HVAC & radiator loops" },
  { company: "Illovo Sugar South Africa", subsector: "Commercial Agriculture", facility: "Sezela Sugar Mill & Estate", decisionMaker: "Agricultural Irrigation Lead", annualLossM3: 155000, lossValueZar: 6975000, status: "NOT_CONTACTED", painPoint: "Off-grid high-volume irrigation channels" },
  { company: "AECI Limited", subsector: "Heavy Manufacturing", facility: "Modderfontein Chemical Park", decisionMaker: "EHS Compliance Director", annualLossM3: 85000, lossValueZar: 3825000, status: "NOT_CONTACTED", painPoint: "Corrosive solvent piping containment" },
  { company: "ArcelorMittal South Africa", subsector: "Heavy Manufacturing", facility: "Vanderbijlpark Works", decisionMaker: "Heavy Infrastructure Lead", annualLossM3: 290000, lossValueZar: 13050000, status: "NOT_CONTACTED", painPoint: "Blast-furnace cooling water conduits" },
  { company: "Impala Platinum", subsector: "Mining & Minerals", facility: "Phokeng Shaft Complexes", decisionMaker: "Operations Director", annualLossM3: 220000, lossValueZar: 9900000, status: "NOT_CONTACTED", painPoint: "Extreme-depth underground slurry pumps" },
  { company: "Harmony Gold Mining", subsector: "Mining & Minerals", facility: "Mponeng Gold Mine", decisionMaker: "Chief Utility Engineer", annualLossM3: 265000, lossValueZar: 11925000, status: "NOT_CONTACTED", painPoint: "High-head fissure water dewatering" },
  { company: "Gold Fields South Africa", subsector: "Mining & Minerals", facility: "South Deep Mine Complex", decisionMaker: "Mine Plant Manager", annualLossM3: 210000, lossValueZar: 9450000, status: "NOT_CONTACTED", painPoint: "Shaft-bottom sumps & high-pressure mains" },
  { company: "Exxaro Resources", subsector: "Mining & Minerals", facility: "Grootegeluk Coal Mine", decisionMaker: "Process Plant Manager", annualLossM3: 145000, lossValueZar: 6525000, status: "NOT_CONTACTED", painPoint: "Coal washing loops & high-grit slurry" },
  { company: "South32 Limited", subsector: "Heavy Manufacturing", facility: "Hillside Aluminium Smelter", decisionMaker: "Smelter Mechanical Lead", annualLossM3: 180000, lossValueZar: 8100000, status: "NOT_CONTACTED", painPoint: "Potline water-jacket cooling loops" },
  { company: "Omnia Holdings", subsector: "Heavy Manufacturing", facility: "Sasolburg Fertilizer Plant", decisionMaker: "Plant Operations Director", annualLossM3: 110000, lossValueZar: 4950000, status: "NOT_CONTACTED", painPoint: "Nitric acid and chemical feed lines" },
  { company: "Tiger Brands Limited", subsector: "Heavy Manufacturing", facility: "Germiston Food Processing", decisionMaker: "Facilities Director", annualLossM3: 75000, lossValueZar: 3375000, status: "NOT_CONTACTED", painPoint: "Steam boiler & high-sanitation washdowns" },
  { company: "Astral Foods", subsector: "Commercial Agriculture", facility: "Standerton Feedmill & Farm", decisionMaker: "Farm Infrastructure Lead", annualLossM3: 125000, lossValueZar: 5625000, status: "NOT_CONTACTED", painPoint: "High-volume boreholes & wash loops" },
  { company: "PPC Cement", subsector: "Heavy Manufacturing", facility: "Riebeeck West Plant", decisionMaker: "Operations Manager", annualLossM3: 95000, lossValueZar: 4275000, status: "NOT_CONTACTED", painPoint: "High-dust quarry cooling piping" },
  { company: "Bell Equipment", subsector: "Heavy Manufacturing", facility: "Richards Bay VMC Site", decisionMaker: "Plant Operations Director", annualLossM3: 65000, lossValueZar: 2925000, status: "NOT_CONTACTED", painPoint: "Hydraulic test-rig cooling circuits" },
];

// GET /api/b2b/pipeline — return all B2B targets
router.get('/pipeline', (req, res) => {
  const totalLossM3 = B2B_PIPELINE.reduce((s, p) => s + p.annualLossM3, 0);
  const totalLossZar = B2B_PIPELINE.reduce((s, p) => s + p.lossValueZar, 0);
  const contacted = B2B_PIPELINE.filter(p => p.status !== 'NOT_CONTACTED').length;
  res.json({
    targets: B2B_PIPELINE,
    summary: {
      totalTargets: B2B_PIPELINE.length,
      totalLossM3,
      totalLossZar,
      contacted,
      notContacted: B2B_PIPELINE.length - contacted,
      avgLossZar: totalLossZar / B2B_PIPELINE.length,
    }
  });
});

// GET /api/b2b/pipeline/:company — return single target
router.get('/pipeline/:company', (req, res) => {
  const target = B2B_PIPELINE.find(p => p.company.toLowerCase().includes(req.params.company.toLowerCase()));
  if (!target) return res.status(404).json({ error: 'Company not found' });
  res.json(target);
});

// GET /api/b2b/subsectors — return subsector breakdown
router.get('/subsectors', (req, res) => {
  const subsectors: Record<string, { count: number; totalLossZar: number; totalLossM3: number }> = {};
  for (const t of B2B_PIPELINE) {
    if (!subsectors[t.subsector]) subsectors[t.subsector] = { count: 0, totalLossZar: 0, totalLossM3: 0 };
    subsectors[t.subsector].count++;
    subsectors[t.subsector].totalLossZar += t.lossValueZar;
    subsectors[t.subsector].totalLossM3 += t.annualLossM3;
  }
  res.json(subsectors);
});

// GET /api/b2b/parameters — return reference parameters
router.get('/parameters', (req, res) => {
  res.json({
    industrialPotableWaterTariffZar: 28.5,
    industrialEffluentSurchargeZar: 16.5,
    combinedLossFactorZar: 45.0,
    unavoidableLeakageFlowTargetLps: 1,
    bayesianLocalisationRadiusM: 500,
    hbkCoreUnitMassKg: 10.485,
    hardLiftingCeilingKg: 10.5,
    reservedMassMarginG: 14.849,
    nominalDesignPressureBar: 6,
    peakCatastrophicSurgeBar: 20,
  });
});

export default router;
