import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import type { FixtureCatalog } from "../../application/ports/fixture-catalog";
import type { RawFixture } from "../../application/models/render-artifacts";

interface FixtureDefinition {
  readonly fixtureId: string;
  readonly sourceAssetPath: string;
  readonly description: string;
}

export class ProjectFixtureCatalog implements FixtureCatalog {
  private readonly fixturesById: ReadonlyMap<string, FixtureDefinition>;

  public constructor(projectRoot: string = path.resolve(import.meta.dir, "../../..")) {
    const supportedFixturePath = path.resolve(projectRoot, "assets", "_DSC8809.ARW");
    const legacyFixturePath = path.resolve(projectRoot, "../DSC00075.ARW");

    this.fixturesById = new Map<string, FixtureDefinition>([
      [
        "sample-fixture",
        {
          fixtureId: "sample-fixture",
          sourceAssetPath: supportedFixturePath,
          description: "Canonical supported raw fixture used for smoke rendering."
        }
      ],
      [
        "legacy-sony-a7m5-fixture",
        {
          fixtureId: "legacy-sony-a7m5-fixture",
          sourceAssetPath: legacyFixturePath,
          description:
            "Older Sony fixture kept for compatibility research; may not decode on packaged darktable builds."
        }
      ]
    ]);
  }

  public async getFixtureById(fixtureId: string): Promise<RawFixture> {
    const fixture = this.fixturesById.get(fixtureId);

    if (fixture === undefined) {
      throw new Error(
        `Unknown fixture id '${fixtureId}'. ` +
          `Available fixtures: ${Array.from(this.fixturesById.keys()).join(", ")}.`
      );
    }

    try {
      await access(fixture.sourceAssetPath, constants.F_OK);
    } catch {
      throw new Error(
        `Expected fixture file not found at ${fixture.sourceAssetPath}. ` +
          "Add the raw fixture to the repository assets directory."
      );
    }

    return fixture;
  }
}
