import type { RawFixture } from "../models/render-artifacts";

export interface FixtureCatalog {
  getFixtureById(fixtureId: string): Promise<RawFixture>;
}
