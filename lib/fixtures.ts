import manufacturing from "./data/manufacturing.json";
import healthcare from "./data/healthcare.json";
import { CausalFixture, type DomainId } from "./engine/types";

/** Parsed once at module load so a malformed fixture fails the build, not a request. */
export const FIXTURES: Record<DomainId, CausalFixture> = {
  manufacturing: CausalFixture.parse(manufacturing),
  healthcare: CausalFixture.parse(healthcare),
};

export const DOMAIN_ORDER: DomainId[] = ["manufacturing", "healthcare"];

export function getFixture(domain: DomainId): CausalFixture {
  return FIXTURES[domain];
}
