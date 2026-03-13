import { describe, expect, test } from "bun:test";

import type {
  ManifestSaveRequest,
  RawFixture,
  RenderManifest,
  SmokePreviewRequest,
  SmokePreviewResult
} from "../models/render-artifacts";
import type { Clock } from "../ports/clock";
import type { FixtureCatalog } from "../ports/fixture-catalog";
import type { IdGenerator } from "../ports/id-generator";
import type { ManifestRepository } from "../ports/manifest-repository";
import type { SmokePreviewRenderer } from "../ports/smoke-preview-renderer";
import { RunDarktableSmokeTest } from "./run-darktable-smoke-test";

describe("RunDarktableSmokeTest", (): void => {
  test("renders smoke preview, builds manifest, and saves renderer diagnostics", async (): Promise<void> => {
    const fixtureCatalog = new StubFixtureCatalog();
    const renderer = new StubSmokePreviewRenderer();
    const manifestRepository = new StubManifestRepository();
    const useCase = new RunDarktableSmokeTest(
      fixtureCatalog,
      renderer,
      new StubClock(new Date("2026-01-01T00:00:00.000Z")),
      new StubIdGenerator(["manifest-1", "smoke-1"]),
      manifestRepository
    );

    const result = await useCase.execute({ fixtureId: "sample-fixture" });

    expect(renderer.lastRequest).toEqual({
      manifestId: "manifest-1",
      smokeTestId: "smoke-1",
      fixtureId: "sample-fixture",
      sourceAssetPath: "/fixtures/source.ARW",
      outputImagePath: "/tmp/manifest-1-smoke.jpg",
      requestedAt: new Date("2026-01-01T00:00:00.000Z")
    });
    expect(result.manifest).toEqual({
      kind: "smoke",
      manifestId: "manifest-1",
      manifestPath: "/artifacts/manifests/manifest-1.json",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      sourceAssetPath: "/fixtures/source.ARW",
      outputImagePath: "/artifacts/smoke/manifest-1-smoke-1-smoke.jpg",
      requestedAt: new Date("2026-01-01T00:00:00.000Z"),
      diagnostics: {
        binaryPath: "/usr/bin/darktable-cli",
        commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
        runtimeState: {
          rootDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1",
          configDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/config",
          cacheDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/cache",
          temporaryDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/tmp",
          libraryPath: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/library.db"
        },
        exitCode: 0
      },
      fixtureId: "sample-fixture",
      smokeTestId: "smoke-1",
      smokeStartedAt: new Date("2026-01-01T00:00:01.000Z"),
      smokeCompletedAt: new Date("2026-01-01T00:00:02.000Z")
    });
    expect(manifestRepository.lastSaveRequest).toEqual<ManifestSaveRequest>({
      manifest: result.manifest
    });
  });
});

class StubFixtureCatalog implements FixtureCatalog {
  public getFixtureById(_fixtureId: string): Promise<RawFixture> {
    void _fixtureId;
    return Promise.resolve({
      fixtureId: "sample-fixture",
      sourceAssetPath: "/fixtures/source.ARW",
      description: "Sample fixture"
    });
  }
}

class StubSmokePreviewRenderer implements SmokePreviewRenderer {
  public lastRequest: SmokePreviewRequest | null = null;

  public renderSmokePreview(request: SmokePreviewRequest): Promise<SmokePreviewResult> {
    this.lastRequest = request;
    return Promise.resolve({
      manifestId: request.manifestId,
      smokeTestId: request.smokeTestId,
      outputImagePath: "/artifacts/smoke/manifest-1-smoke-1-smoke.jpg",
      startedAt: new Date("2026-01-01T00:00:01.000Z"),
      completedAt: new Date("2026-01-01T00:00:02.000Z"),
      diagnostics: {
        binaryPath: "/usr/bin/darktable-cli",
        commandArguments: ["/usr/bin/darktable-cli", request.sourceAssetPath],
        runtimeState: {
          rootDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1",
          configDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/config",
          cacheDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/cache",
          temporaryDirectory: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/tmp",
          libraryPath: "/artifacts/runtime/darktable/smoke-manifest-1-smoke-1/library.db"
        },
        exitCode: 0
      }
    });
  }
}

class StubClock implements Clock {
  public constructor(private readonly nowValue: Date) {}

  public now(): Date {
    return this.nowValue;
  }
}

class StubIdGenerator implements IdGenerator {
  private index = 0;

  public constructor(private readonly values: ReadonlyArray<string>) {}

  public generate(): string {
    const value = this.values[this.index];

    if (value === undefined) {
      throw new Error("Id generator has no more values configured.");
    }

    this.index += 1;
    return value;
  }
}

class StubManifestRepository implements ManifestRepository {
  public lastSaveRequest: ManifestSaveRequest | null = null;

  public getManifestPath(manifestId: string): string {
    return `/artifacts/manifests/${manifestId}.json`;
  }

  public saveManifest<TManifest extends RenderManifest>(
    request: ManifestSaveRequest<TManifest>
  ): Promise<TManifest> {
    this.lastSaveRequest = request;
    return Promise.resolve(request.manifest);
  }
}
