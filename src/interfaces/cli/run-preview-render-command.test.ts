import { describe, expect, test } from "bun:test";

import { RunPreviewRenderCommand } from "./run-preview-render-command";
import type {
  CreatePreviewRenderRequest,
  CreatePreviewRenderResult
} from "../../application/use-cases/create-preview-render";

describe("RunPreviewRenderCommand", () => {
  test("returns machine-readable preview artifact paths on success", async () => {
    const command = new RunPreviewRenderCommand(new StubCreatePreviewRender());

    const result = await command.execute({
      requestId: "request-1",
      recipe: {
        recipeId: "recipe-1",
        sourceAssetPath: "/fixtures/source.ARW",
        adjustments: [{ kind: "exposure", exposure: 0.25 }]
      }
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-1",
        status: "ok",
        manifestId: "manifest-1",
        manifestPath: "/artifacts/manifests/manifest-1.json",
        outputImagePath: "/artifacts/preview/manifest-1-preview.jpg",
        sourceAssetPath: "/fixtures/source.ARW",
        compiledArtifactPath: "/artifacts/preview/recipes/compile-1.xmp",
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1",
            configDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/config",
            cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/tmp",
            libraryPath: "/artifacts/runtime/darktable/preview-manifest-1-render-1/library.db"
          },
          exitCode: 0
        }
      }
    });
  });
});

class StubCreatePreviewRender {
  public execute(_request: CreatePreviewRenderRequest): Promise<CreatePreviewRenderResult> {
    void _request;

    return Promise.resolve({
      status: "ok",
      compiledRecipe: {
        compileId: "compile-1",
        recipeId: "recipe-1",
        sourceAssetPath: "/fixtures/source.ARW",
        compiledArtifactPath: "/artifacts/preview/recipes/compile-1.xmp",
        xmpSidecarPath: "/artifacts/preview/recipes/compile-1.xmp",
        modules: [{ operation: "exposure", modversion: 6 }]
      },
      manifest: {
        kind: "preview",
        manifestId: "manifest-1",
        manifestPath: "/artifacts/manifests/manifest-1.json",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        sourceAssetPath: "/fixtures/source.ARW",
        outputImagePath: "/artifacts/preview/manifest-1-preview.jpg",
        requestedAt: new Date("2026-01-01T00:00:00.000Z"),
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1",
            configDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/config",
            cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/tmp",
            libraryPath: "/artifacts/runtime/darktable/preview-manifest-1-render-1/library.db"
          },
          exitCode: 0
        },
        recipeId: "recipe-1",
        renderId: "render-1",
        compileId: "compile-1",
        compiledArtifactPath: "/artifacts/preview/recipes/compile-1.xmp",
        previewStartedAt: new Date("2026-01-01T00:00:01.000Z"),
        previewCompletedAt: new Date("2026-01-01T00:00:02.000Z")
      },
      previewResult: {
        manifestId: "manifest-1",
        renderId: "render-1",
        outputImagePath: "/artifacts/preview/manifest-1-preview.jpg",
        startedAt: new Date("2026-01-01T00:00:01.000Z"),
        completedAt: new Date("2026-01-01T00:00:02.000Z"),
        diagnostics: {
          binaryPath: "/usr/bin/darktable-cli",
          commandArguments: ["/usr/bin/darktable-cli", "/fixtures/source.ARW"],
          runtimeState: {
            rootDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1",
            configDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/config",
            cacheDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/cache",
            temporaryDirectory: "/artifacts/runtime/darktable/preview-manifest-1-render-1/tmp",
            libraryPath: "/artifacts/runtime/darktable/preview-manifest-1-render-1/library.db"
          },
          exitCode: 0
        }
      }
    });
  }
}
