import { describe, expect, test } from "bun:test";

import { type DevelopRecipe, type DevelopRecipeValidationIssue } from "../../contracts/develop-recipe";
import type {
  CompiledDevelopRecipe,
  ManifestSaveRequest,
  PreviewRenderRequest,
  PreviewRenderResult,
  RenderManifest
} from "../models/render-artifacts";
import type { Clock } from "../ports/clock";
import type { DevelopRecipeCompiler } from "../ports/develop-recipe-compiler";
import type { IdGenerator } from "../ports/id-generator";
import type { ManifestRepository } from "../ports/manifest-repository";
import type { PreviewArtifactLayout } from "../ports/preview-artifact-layout";
import type { PreviewRenderer } from "../ports/preview-renderer";
import type { DevelopRecipeValidator } from "../ports/develop-recipe-validator";
import { CreatePreviewRender, type CreatePreviewRenderRequest } from "./create-preview-render";

describe("CreatePreviewRender", (): void => {
  test("returns validation failure without running compile/render/save", async (): Promise<void> => {
    const fixedDate = new Date("2026-01-01T00:00:00.000Z");
    const validator = new StubValidator([
      {
        code: "EMPTY_ADJUSTMENTS",
        message: "Develop recipes must contain at least one adjustment."
      }
    ]);
    const compiler = new StubCompiler();
    const renderer = new StubPreviewRenderer();
    const manifestRepository = new StubManifestRepository();
    const previewArtifactLayout = new StubPreviewArtifactLayout();
    const useCase = new CreatePreviewRender(
      validator,
      compiler,
      renderer,
      manifestRepository,
      previewArtifactLayout,
      new StubClock(fixedDate),
      new StubIdGenerator(["manifest-id", "render-id"])
    );

    const request: CreatePreviewRenderRequest = {
      recipe: {
        recipeId: "recipe-invalid",
        sourceAssetPath: "./fixtures/raw.nef",
        adjustments: []
      }
    };

    const result = await useCase.execute(request);

    expect(result.status).toBe("validation-failed");
    if (result.status !== "validation-failed") {
      throw new Error("Expected validation failure result");
    }
    expect(result.validationIssues).toEqual<ReadonlyArray<DevelopRecipeValidationIssue>>([
      {
        code: "EMPTY_ADJUSTMENTS",
        message: "Develop recipes must contain at least one adjustment."
      }
    ]);
    expect(compiler.compileCallCount).toBe(0);
    expect(renderer.renderCallCount).toBe(0);
    expect(manifestRepository.saveManifestCallCount).toBe(0);
    expect(previewArtifactLayout.getPreviewOutputPathCallCount).toBe(0);
  });

  test("compiles recipe, renders preview, builds manifest, and saves it", async (): Promise<void> => {
    const fixedDate = new Date("2026-01-01T00:00:00.000Z");
    const validator = new StubValidator([]);
    const compiler = new StubCompiler();
    const renderer = new StubPreviewRenderer();
    const manifestRepository = new StubManifestRepository();
    const previewArtifactLayout = new StubPreviewArtifactLayout();
    const useCase = new CreatePreviewRender(
      validator,
      compiler,
      renderer,
      manifestRepository,
      previewArtifactLayout,
      new StubClock(fixedDate),
      new StubIdGenerator(["manifest-id", "render-id"])
    );

    const request: CreatePreviewRenderRequest = {
      recipe: {
        recipeId: "recipe-valid",
        sourceAssetPath: "./fixtures/raw.nef",
        adjustments: [
          {
            kind: "exposure",
            exposure: 0
          }
        ]
      }
    };

    const result = await useCase.execute(request);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      throw new Error("Expected success result");
    }
    expect(validator.validateCallCount).toBe(1);
    expect(compiler.compileCallCount).toBe(1);
    expect(renderer.renderCallCount).toBe(1);
    expect(previewArtifactLayout.getPreviewOutputPathCallCount).toBe(1);
    expect(renderer.lastRenderRequest).toEqual<PreviewRenderRequest>({
      manifestId: "manifest-id",
      renderId: "render-id",
      recipeId: "recipe-valid",
      sourceAssetPath: "./fixtures/raw.nef",
      compiledRecipe: {
        compileId: "compiled-example",
        recipeId: "recipe-valid",
        sourceAssetPath: "./fixtures/raw.nef",
        compiledArtifactPath: "/artifacts/preview/recipes/compiled-example.xmp",
        xmpSidecarPath: "/artifacts/preview/recipes/compiled-example.xmp",
        modules: [{ operation: "exposure", modversion: 6 }]
      },
      outputImagePath: "/artifacts/preview/manifest-id-preview.jpg",
      requestedAt: fixedDate
    });
    expect(result.manifest).toEqual({
      kind: "preview",
      manifestId: "manifest-id",
      manifestPath: "/artifacts/manifests/manifest-id.json",
      createdAt: fixedDate,
      sourceAssetPath: "./fixtures/raw.nef",
      outputImagePath: "/artifacts/preview/manifest-id-preview.jpg",
      requestedAt: fixedDate,
      diagnostics: {
        binaryPath: "/usr/bin/darktable-cli",
        commandArguments: ["/usr/bin/darktable-cli", "./fixtures/raw.nef"],
        runtimeState: {
          rootDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id",
          configDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/config",
          cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/cache",
          temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/tmp",
          libraryPath: "/artifacts/runtime/darktable/preview-manifest-id-render-id/library.db"
        },
        exitCode: 0
      },
      recipeId: "recipe-valid",
      renderId: "render-id",
      compileId: "compiled-example",
      compiledArtifactPath: "/artifacts/preview/recipes/compiled-example.xmp",
      previewStartedAt: new Date("2026-01-01T00:00:01.000Z"),
      previewCompletedAt: new Date("2026-01-01T00:00:02.000Z")
    });
    expect(result.previewResult).toEqual<PreviewRenderResult>({
      manifestId: "manifest-id",
      renderId: "render-id",
      outputImagePath: "/artifacts/preview/manifest-id-preview.jpg",
      startedAt: new Date("2026-01-01T00:00:01.000Z"),
      completedAt: new Date("2026-01-01T00:00:02.000Z"),
      diagnostics: {
        binaryPath: "/usr/bin/darktable-cli",
        commandArguments: ["/usr/bin/darktable-cli", "./fixtures/raw.nef"],
        runtimeState: {
          rootDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id",
          configDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/config",
          cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/cache",
          temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/tmp",
          libraryPath: "/artifacts/runtime/darktable/preview-manifest-id-render-id/library.db"
        },
        exitCode: 0
      }
    });
    expect(manifestRepository.saveManifestCallCount).toBe(1);
    expect(manifestRepository.lastSaveRequest).toEqual<ManifestSaveRequest>({
      manifest: {
        kind: "preview",
        manifestId: "manifest-id",
        manifestPath: "/artifacts/manifests/manifest-id.json",
        createdAt: fixedDate,
        sourceAssetPath: "./fixtures/raw.nef",
        outputImagePath: "/artifacts/preview/manifest-id-preview.jpg",
        requestedAt: fixedDate,
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "./fixtures/raw.nef"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id",
            configDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/config",
            cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/tmp",
            libraryPath: "/artifacts/runtime/darktable/preview-manifest-id-render-id/library.db"
          },
          exitCode: 0
        },
        recipeId: "recipe-valid",
        renderId: "render-id",
        compileId: "compiled-example",
        compiledArtifactPath: "/artifacts/preview/recipes/compiled-example.xmp",
        previewStartedAt: new Date("2026-01-01T00:00:01.000Z"),
        previewCompletedAt: new Date("2026-01-01T00:00:02.000Z")
      }
    });
  });
});

class StubValidator implements DevelopRecipeValidator {
  public validateCallCount = 0;

  public constructor(private readonly issues: ReadonlyArray<DevelopRecipeValidationIssue>) {}

  public validate(_recipe: DevelopRecipe): ReadonlyArray<DevelopRecipeValidationIssue> {
    void _recipe;
    this.validateCallCount += 1;
    return this.issues;
  }
}

class StubCompiler implements DevelopRecipeCompiler {
  public compileCallCount = 0;

  public compile(_recipe: DevelopRecipe): Promise<CompiledDevelopRecipe> {
    void _recipe;
    this.compileCallCount += 1;
    return Promise.resolve({
      compileId: "compiled-example",
      recipeId: "recipe-valid",
      sourceAssetPath: "./fixtures/raw.nef",
      compiledArtifactPath: "/artifacts/preview/recipes/compiled-example.xmp",
      xmpSidecarPath: "/artifacts/preview/recipes/compiled-example.xmp",
      modules: [{ operation: "exposure", modversion: 6 }]
    });
  }
}

class StubPreviewRenderer implements PreviewRenderer {
  public renderCallCount = 0;
  public lastRenderRequest: PreviewRenderRequest | null = null;

  public renderPreview(request: PreviewRenderRequest): Promise<PreviewRenderResult> {
    this.renderCallCount += 1;
    this.lastRenderRequest = request;

    return Promise.resolve({
      manifestId: request.manifestId,
      renderId: request.renderId,
      outputImagePath: request.outputImagePath,
      startedAt: new Date("2026-01-01T00:00:01.000Z"),
      completedAt: new Date("2026-01-01T00:00:02.000Z"),
      diagnostics: {
        binaryPath: "/usr/bin/darktable-cli",
        commandArguments: ["/usr/bin/darktable-cli", request.sourceAssetPath],
        runtimeState: {
          rootDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id",
          configDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/config",
          cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/cache",
          temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-id-render-id/tmp",
          libraryPath: "/artifacts/runtime/darktable/preview-manifest-id-render-id/library.db"
        },
        exitCode: 0
      }
    });
  }
}

class StubManifestRepository implements ManifestRepository {
  public saveManifestCallCount = 0;
  public lastSaveRequest: ManifestSaveRequest | null = null;

  public getManifestPath(manifestId: string): string {
    return `/artifacts/manifests/${manifestId}.json`;
  }

  public saveManifest<TManifest extends RenderManifest>(
    request: ManifestSaveRequest<TManifest>
  ): Promise<TManifest> {
    this.saveManifestCallCount += 1;
    this.lastSaveRequest = request;

    return Promise.resolve(request.manifest);
  }
}

class StubPreviewArtifactLayout implements PreviewArtifactLayout {
  public getPreviewOutputPathCallCount = 0;

  public getPreviewOutputPath(manifestId: string): string {
    this.getPreviewOutputPathCallCount += 1;
    return `/artifacts/preview/${manifestId}-preview.jpg`;
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
