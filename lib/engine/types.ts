import { z } from "zod";

/** Shared contract: the offline builder emits this, the dashboard renders it. */

export const DomainId = z.enum(["manufacturing", "healthcare"]);
export type DomainId = z.infer<typeof DomainId>;

export const NodeRole = z.enum(["confounder", "treatment", "mediator", "exogenous", "outcome"]);
export const EdgeStrength = z.enum(["strong", "moderate", "weak"]);

const GraphNode = z.object({
  id: z.string(),
  label: z.string(),
  role: NodeRole,
  x: z.number(),
  y: z.number(),
});

const GraphEdge = z.object({
  source: z.string(),
  target: z.string(),
  coef: z.number(),
  strength: EdgeStrength,
  discovered: z.boolean(),
  bootstrapFreq: z.number(),
  pruned: z.boolean(),
});

const ObjectSummary = z.object({
  name: z.string(),
  records: z.number(),
  attributes: z.number(),
  missingPct: z.number(),
  qualityPct: z.number(),
  updated: z.string(),
});

const Variable = z.object({
  name: z.string(),
  object: z.string(),
  type: z.enum(["numeric", "categorical", "boolean", "datetime"]),
  role: z.enum(["treatment", "mediator", "confounder", "outcome", "context", "exogenous"]),
  missingPct: z.number(),
});

const Effect = z.object({
  driver: z.string(),
  label: z.string(),
  effectDays: z.number(),
  ciLow: z.number(),
  ciHigh: z.number(),
  groundTruthDays: z.number(),
  naiveDays: z.number(),
  method: z.string(),
});

const RecommendedAction = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  deltaDays: z.number(),
  reductionPct: z.number(),
  annualSavings: z.number(),
  roi: z.number(),
  confidence: z.enum(["High", "Medium", "Low"]),
  effort: z.enum(["Low", "Medium", "High"]),
  timeline: z.string(),
  capex: z.number(),
  evidence: z.enum(["MEASURED", "ILLUSTRATIVE"]),
  lever: z.string(),
});

const CaseDriver = z.object({
  label: z.string(),
  contributionDays: z.number(),
  kind: z.enum(["controllable", "structural"]),
});

const CaseRecord = z.object({
  id: z.string(),
  date: z.string(),
  primaryEntity: z.string(),
  category: z.string(),
  value: z.number(),
  actualDelayDays: z.number(),
  predictedDelayDays: z.number(),
  counterfactualDelayDays: z.number(),
  counterfactualLabel: z.string(),
  drivers: z.array(CaseDriver),
  similarCaseIds: z.array(z.string()),
  populationAvg: z.number(),
  percentile: z.number(),
  controllableDays: z.number(),
  structuralDays: z.number(),
  complexityScore: z.number(),
  treated: z.boolean(),
  dominantDriver: z.string(),
});

const TrendPoint = z.object({ period: z.string(), baseline: z.number(), withActions: z.number() });

const Lever = z.object({
  id: z.string(),
  label: z.string(),
  group: z.string(),
  kind: z.enum(["slider", "toggle", "mode"]),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  unit: z.string(),
  baseline: z.number(),
  modes: z.array(z.string()).optional(),
  hint: z.string(),
});

const CoefficientRow = z.object({ edge: z.string(), estimated: z.number(), groundTruth: z.number() });
const CateSegment = z.object({ label: z.string(), effect: z.number(), ciLow: z.number(), ciHigh: z.number() });

const StageSev = z.enum(["ok", "warn", "crit"]);

export const CausalFixture = z.object({
  domain: DomainId,
  generatedAt: z.string(),
  spuriousEdgeReason: z.string(),

  narrative: z.object({
    agentName: z.string(),
    agentRole: z.string(),
    decisionLabel: z.string(),
    altLabel: z.string(),
    outcomeLabel: z.string(),
    agentSignals: z.array(z.object({ label: z.string(), weight: z.number() })),
    agentBlindSpots: z.array(z.string()),
    stages: z.array(z.object({ id: z.string(), label: z.string(), agent: z.string().optional() })),
    incident: z.object({
      trigger: z.string(),
      steps: z.array(z.object({ stageId: z.string(), t: z.string(), note: z.string(), sev: StageSev })),
    }),
  }),

  story: z.object({
    incidentId: z.string(),
    caseId: z.string(),
    trigger: z.string(),
    outcomeVariable: z.string(),
    outcomeUnit: z.string(),
    agent: z.object({
      name: z.string(),
      role: z.string(),
      decision: z.string(),
      alt: z.string(),
      confidencePct: z.number(),
      signals: z.array(z.object({ label: z.string(), weight: z.number() })),
      blindSpots: z.array(z.string()),
    }),
    ripple: z.object({
      stages: z.array(z.object({ id: z.string(), label: z.string(), agent: z.string().optional() })),
      steps: z.array(z.object({ stageId: z.string(), t: z.string(), note: z.string(), sev: StageSev })),
      finalDelayDays: z.number(),
    }),
    cause: z.object({
      path: z.array(z.string()),
      effectDays: z.number(),
      naiveDays: z.number(),
      trueDays: z.number(),
      confounderLabel: z.string(),
      confoundingDays: z.number(),
      confoundingPct: z.number(),
      drivers: z.array(z.object({ label: z.string(), days: z.number() })),
    }),
    whatIf: z.object({
      actualLabel: z.string(),
      actualDays: z.number(),
      cfLabel: z.string(),
      cfDays: z.number(),
      savedDays: z.number(),
      reductionPct: z.number(),
    }),
    confidenceGap: z.object({ agentPct: z.number(), causalPct: z.number(), note: z.string() }),
    trust: z.object({
      verdict: z.string(),
      checks: z.array(z.object({ label: z.string(), detail: z.string(), pass: z.boolean() })),
      evidence: z.array(z.object({ k: z.string(), v: z.string() })),
    }),
    action: z.object({
      title: z.string(),
      detail: z.string(),
      annualSavings: z.number(),
      payback: z.string(),
      confidence: z.string(),
      reductionPct: z.number(),
    }),
  }),

  agentDecisions: z.array(
    z.object({
      id: z.string(),
      agent: z.string(),
      decisionLabel: z.string(),
      confidence: z.number(),
      caseId: z.string(),
      entity: z.string(),
      complexityScore: z.number(),
      outcomeDays: z.number(),
      counterfactualDays: z.number(),
      dominantDriver: z.string(),
      dominantContribution: z.number(),
      controllableDays: z.number(),
      structuralDays: z.number(),
      verdict: z.enum(["over-confident", "under-supported", "aligned"]),
    }),
  ),

  causalAuditScore: z.object({
    score: z.number(),
    status: z.enum(["PROCEED", "MONITOR", "REVIEW RECOMMENDED"]),
    dimensions: z.array(z.object({ key: z.string(), score: z.number(), why: z.string() })),
  }),

  scenario: z.object({
    name: z.string(),
    outcomeVariable: z.string(),
    outcomeUnit: z.string(),
    treatmentLabel: z.string(),
    confounderLabel: z.string(),
    moderatorLabel: z.string(),
    org: z.string(),
    domainLabel: z.string(),
    timeRange: z.string(),
    totalEvents: z.number(),
    treatedCases: z.number(),
    treatedPct: z.number(),
    dataSources: z.number(),
    lastUpdated: z.string(),
    description: z.string(),
    objectTypes: z.number(),
    causalLinks: z.number(),
    reliabilityPct: z.number(),
    objectNames: z.array(z.string()),
    simBaseline: z.number(),
    outcomeMean: z.number(),
    outcomeStd: z.number(),
  }),

  executiveSummary: z.object({
    headline: z.string(),
    confidence: z.enum(["HIGH CONFIDENCE", "MEDIUM CONFIDENCE", "LOW CONFIDENCE"]),
    bullets: z.array(z.string()),
    recommendedAction: z.string(),
    alertOutcome: z.string(),
    alertReductionPct: z.number(),
    chain: z.array(z.string()),
    riskSegment: z.string(),
  }),

  kpis: z.object({
    causalLinks: z.number(),
    target: z.string(),
    expertRules: z.number(),
    reliabilityPct: z.number(),
  }),

  discoveryMetrics: z.object({
    precision: z.number(),
    recall: z.number(),
    f1: z.number(),
    stability: z.number(),
    bootstrapRuns: z.number(),
    shd: z.number(),
    truePositives: z.number(),
    falsePositives: z.number(),
    falseNegatives: z.number(),
    edgeStability: z.array(z.object({ edge: z.string(), frequency: z.number(), discovered: z.boolean(), pruned: z.boolean() })),
  }),

  pipelinePerf: z.object({
    prePrecision: z.number(),
    preRecall: z.number(),
    preF1: z.number(),
    effectErrorPct: z.number(),
    confoundingRemovedPct: z.number(),
    bootstrapStability: z.number(),
    eValue: z.number(),
    avgModelR2: z.number(),
    avgCoefErrorPct: z.number(),
    signCertain: z.number(),
    signTotal: z.number(),
    missingEdgesRecovered: z.number(),
    spuriousRemoved: z.number(),
    validatedLinks: z.number(),
  }),

  data: z.object({
    datasets: z.number(),
    variables: z.number(),
    causalLinks: z.number(),
    qualityPct: z.number(),
    objects: z.array(ObjectSummary),
    variableList: z.array(Variable),
    sampleEvents: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  }),

  discovery: z.object({
    totalEvents: z.number(),
    treatedCases: z.number(),
    treatedPct: z.number(),
    avgOutcome: z.number(),
    stdOutcome: z.number(),
    objectInstances: z.number(),
    coOccurrenceEdges: z.number(),
    avgDegree: z.number(),
    topResources: z.array(z.object({ label: z.string(), value: z.string() })),
    correlationGroups: z.array(
      z.object({
        name: z.string(),
        options: z.array(z.object({ label: z.string(), onTimePct: z.number(), delayedPct: z.number() })),
      }),
    ),
    strongestRelationship: z.object({ from: z.string(), to: z.string(), coefficient: z.number() }),
  }),

  causalGraph: z.object({ nodes: z.array(GraphNode), edges: z.array(GraphEdge) }),

  effects: z.array(Effect),
  naiveEffect: z.object({
    naiveDays: z.number(),
    causalDays: z.number(),
    biasDays: z.number(),
    biasPct: z.number(),
    inflationPct: z.number(),
    ciLow: z.number(),
    ciHigh: z.number(),
    method: z.string(),
  }),
  coefficients: z.array(CoefficientRow),
  cate: z.object({
    driver: z.string(),
    segmentVar: z.string(),
    ate: z.number(),
    segments: z.array(CateSegment),
    note: z.string(),
  }),
  sensitivity: z.object({
    placeboEffect: z.number(),
    placeboPass: z.boolean(),
    randomCauseEstimate: z.number(),
    randomCauseStable: z.boolean(),
    eValue: z.number(),
    reportedEstimate: z.number(),
    strengths: z.array(z.number()),
    estimatesUnderConfounding: z.array(z.number()),
    verdict: z.string(),
    seedRobustness: z.object({
      nSeeds: z.number(),
      causalMean: z.number(),
      causalStd: z.number(),
      causalLo: z.number(),
      causalHi: z.number(),
      naiveLo: z.number(),
      naiveHi: z.number(),
    }),
  }),

  effectAccuracy: z.array(z.object({ bucket: z.string(), count: z.number() })),
  topDrivers: z.array(z.object({ label: z.string(), impactDays: z.number() })),
  recommendedActions: z.array(RecommendedAction),
  projectedImpact: z.object({
    totalReductionPct: z.number(),
    totalReductionDays: z.number(),
    trend: z.array(TrendPoint),
  }),

  simulator: z.object({
    baselineOutcome: z.number(),
    outcomeLabel: z.string(),
    throughputBaseline: z.number(),
    riskBaseline: z.number(),
    costPerDelayDay: z.number(),
    annualVolume: z.number(),
    mediators: z.array(z.object({ name: z.string(), baseline: z.number(), unit: z.string() })),
    levers: z.array(Lever),
  }),

  report: z.object({
    date: z.string(),
    casesAnalysed: z.number(),
    groundTruthEffect: z.number(),
    dmlEffect: z.number(),
    confoundingRemoved: z.number(),
    naiveDays: z.number(),
    achievableReductionPct: z.number(),
    baselineDays: z.number(),
    targetDays: z.number(),
    primaryChain: z.array(z.string()),
    signConsistency: z.string(),
    methodology: z.array(z.object({ phase: z.string(), detail: z.string() })),
    actions: z.array(
      z.object({
        rank: z.number(),
        action: z.string(),
        impactPct: z.number(),
        confidence: z.string(),
        value: z.string(),
        timeline: z.string(),
      }),
    ),
    totalCapex: z.number(),
    roiPayback: z.string(),
    riskLevel: z.string(),
  }),

  crossDomain: z.array(
    z.object({
      domain: z.string(),
      precision: z.number(),
      recall: z.number(),
      f1: z.number(),
      naive: z.number(),
      causal: z.number(),
      planted: z.number(),
      eValue: z.number(),
    }),
  ),

  copilot: z.object({
    chips: z.array(z.object({ key: z.string(), label: z.string(), icon: z.string() })),
    followUps: z.record(z.string(), z.array(z.string())),
    capabilities: z.array(
      z.object({ icon: z.string(), title: z.string(), detail: z.string(), tags: z.array(z.string()), prompt: z.string() }),
    ),
  }),

  cases: z.array(CaseRecord),
});

export type CausalFixture = z.infer<typeof CausalFixture>;
export type GraphNode = z.infer<typeof GraphNode>;
export type GraphEdge = z.infer<typeof GraphEdge>;
export type Effect = z.infer<typeof Effect>;
export type RecommendedAction = z.infer<typeof RecommendedAction>;
export type CaseRecord = z.infer<typeof CaseRecord>;
export type ObjectSummary = z.infer<typeof ObjectSummary>;
export type Variable = z.infer<typeof Variable>;
export type Lever = z.infer<typeof Lever>;
