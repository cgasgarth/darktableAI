import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { PreviewRenderRequest } from "../../application/models/render-artifacts";
import { LocalRunLayout } from "../runtime/local-run-layout";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";
import { DarktableCliPreviewRenderer } from "./darktable-cli-preview-renderer";

describe("DarktableCliPreviewRenderer", (): void => {
  const tempDirectories: Array<string> = [];

  afterEach((): void => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("invokes darktable-cli with isolated runtime state", async (): Promise<void> => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-preview-renderer-"));
    tempDirectories.push(projectRoot);

    const runLayout = new LocalRunLayout(projectRoot);
    const sourceAssetPath = path.join(projectRoot, "fixtures", "source.ARW");
    const xmpSidecarPath = runLayout.getPreviewRecipeSidecarPath("compile-1");
    const outputImagePath = runLayout.getPreviewOutputPath("manifest-1");

    mkdirSync(path.dirname(sourceAssetPath), { recursive: true });
    writeFileSync(sourceAssetPath, "raw-fixture");
    writeFileSync(xmpSidecarPath, "<xmp />");

    const processRunner = new StubProcessRunner((command: ReadonlyArray<string>): DarktableCliProcessResult => {
      writeFileSync(outputImagePath, "preview-image");
      expect(command).toEqual([
        "/usr/bin/darktable-cli",
        sourceAssetPath,
        xmpSidecarPath,
        outputImagePath,
        "--core",
        "--configdir",
        path.join(
          projectRoot,
          "artifacts",
          "runtime",
          "darktable",
          "preview-manifest-1-render-1",
          "config"
        ),
        "--cachedir",
        path.join(
          projectRoot,
          "artifacts",
          "runtime",
          "darktable",
          "preview-manifest-1-render-1",
          "cache"
        ),
        "--library",
        path.join(
          projectRoot,
          "artifacts",
          "runtime",
          "darktable",
          "preview-manifest-1-render-1",
          "library.db"
        ),
        "--tmpdir",
        path.join(
          projectRoot,
          "artifacts",
          "runtime",
          "darktable",
          "preview-manifest-1-render-1",
          "tmp"
        )
      ]);

      return {
        exitCode: 0,
        stdout: "",
        stderr: ""
      };
    });

    const renderer = new DarktableCliPreviewRenderer(
      new StubClock([new Date("2026-01-01T00:00:01.000Z"), new Date("2026-01-01T00:00:02.000Z")]),
      {
        locate: () =>
          Promise.resolve({
            status: "available" as const,
            darktableCli: { name: "darktable-cli" as const, path: "/usr/bin/darktable-cli" },
            darktable: { name: "darktable" as const, path: "/usr/bin/darktable" }
          })
      },
      runLayout,
      processRunner
    );

    const request: PreviewRenderRequest = {
      manifestId: "manifest-1",
      renderId: "render-1",
      recipeId: "recipe-1",
      sourceAssetPath,
      compiledRecipe: {
        compileId: "compile-1",
        recipeId: "recipe-1",
        sourceAssetPath,
        compiledArtifactPath: xmpSidecarPath,
        xmpSidecarPath,
        modules: []
      },
      outputImagePath,
      requestedAt: new Date("2026-01-01T00:00:00.000Z")
    };

    const result = await renderer.renderPreview(request);

    expect(result).toEqual({
      manifestId: "manifest-1",
      renderId: "render-1",
      outputImagePath,
      startedAt: new Date("2026-01-01T00:00:01.000Z"),
      completedAt: new Date("2026-01-01T00:00:02.000Z"),
      diagnostics: {
        binaryPath: "/usr/bin/darktable-cli",
        commandArguments: [
          "/usr/bin/darktable-cli",
          sourceAssetPath,
          xmpSidecarPath,
          outputImagePath,
          "--core",
          "--configdir",
          path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "config"
          ),
          "--cachedir",
          path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "cache"
          ),
          "--library",
          path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "library.db"
          ),
          "--tmpdir",
          path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "tmp"
          )
        ],
        runtimeState: {
          rootDirectory: path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1"
          ),
          configDirectory: path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "config"
          ),
          cacheDirectory: path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "cache"
          ),
          temporaryDirectory: path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "tmp"
          ),
          libraryPath: path.join(
            projectRoot,
            "artifacts",
            "runtime",
            "darktable",
            "preview-manifest-1-render-1",
            "library.db"
          )
        },
        exitCode: 0
      }
    });
    expect(processRunner.commands).toHaveLength(1);
  });
});

class StubClock {
  private index = 0;

  public constructor(private readonly values: ReadonlyArray<Date>) {}

  public now(): Date {
    const value = this.values[this.index];

    if (value === undefined) {
      throw new Error("Clock has no more configured values.");
    }

    this.index += 1;
    return value;
  }
}

class StubProcessRunner {
  public readonly commands: Array<ReadonlyArray<string>> = [];

  public constructor(
    private readonly handler: (command: ReadonlyArray<string>) => DarktableCliProcessResult
  ) {}

  public run(command: ReadonlyArray<string>): Promise<DarktableCliProcessResult> {
    this.commands.push([...command]);
    return Promise.resolve(this.handler(command));
  }
}
