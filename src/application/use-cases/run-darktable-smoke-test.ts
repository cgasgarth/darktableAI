import type { Clock } from "../ports/clock";
import type { FixtureCatalog } from "../ports/fixture-catalog";
import type { IdGenerator } from "../ports/id-generator";
import type { ManifestRepository } from "../ports/manifest-repository";
import type { SmokePreviewRenderer } from "../ports/smoke-preview-renderer";
import type {
  ManifestSaveRequest,
  RawFixture,
  SmokeRenderManifest,
  SmokePreviewRequest,
  SmokePreviewResult
} from "../models/render-artifacts";

export interface RunDarktableSmokeTestRequest {
  readonly fixtureId: string;
}

export interface RunDarktableSmokeTestResult {
  readonly status: "ok";
  readonly fixture: RawFixture;
  readonly manifest: SmokeRenderManifest;
  readonly smokePreviewResult: SmokePreviewResult;
}

export class RunDarktableSmokeTest {
  public constructor(
    private readonly fixtureCatalog: FixtureCatalog,
    private readonly smokePreviewRenderer: SmokePreviewRenderer,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
    private readonly manifestRepository: ManifestRepository
  ) {}

  public async execute(request: RunDarktableSmokeTestRequest): Promise<RunDarktableSmokeTestResult> {
    const fixture = await this.fixtureCatalog.getFixtureById(request.fixtureId);
    const requestedAt = this.clock.now();
    const manifestId = this.idGenerator.generate();
    const smokeTestId = this.idGenerator.generate();

    const smokeRequest: SmokePreviewRequest = {
      manifestId,
      smokeTestId,
      fixtureId: fixture.fixtureId,
      sourceAssetPath: fixture.sourceAssetPath,
      outputImagePath: `/tmp/${manifestId}-smoke.jpg`,
      requestedAt
    };

    const smokePreviewResult = await this.smokePreviewRenderer.renderSmokePreview(smokeRequest);

    const manifest = this.buildSmokeManifest(fixture, smokePreviewResult, smokeTestId, manifestId, requestedAt);

    const manifestSaveRequest: ManifestSaveRequest<SmokeRenderManifest> = {
      manifest
    };

    const savedManifest = await this.manifestRepository.saveManifest(manifestSaveRequest);

    return {
      status: "ok",
      fixture,
      manifest: savedManifest,
      smokePreviewResult
    };
  }

  private buildSmokeManifest(
    fixture: RawFixture,
    smokePreviewResult: SmokePreviewResult,
    smokeTestId: string,
    manifestId: string,
    requestedAt: Date
  ): SmokeRenderManifest {
    return {
      kind: "smoke",
      manifestId,
      manifestPath: this.manifestRepository.getManifestPath(manifestId),
      createdAt: requestedAt,
      sourceAssetPath: fixture.sourceAssetPath,
      outputImagePath: smokePreviewResult.outputImagePath,
      requestedAt,
      diagnostics: smokePreviewResult.diagnostics,
      fixtureId: fixture.fixtureId,
      smokeTestId,
      smokeStartedAt: smokePreviewResult.startedAt,
      smokeCompletedAt: smokePreviewResult.completedAt
    };
  }
}
