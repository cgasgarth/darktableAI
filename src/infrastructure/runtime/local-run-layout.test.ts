import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { LocalRunLayout } from "./local-run-layout";

describe("LocalRunLayout", (): void => {
  const tempDirectories: Array<string> = [];

  afterEach((): void => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("allocates isolated darktable runtime directories per run", (): void => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-runtime-layout-"));
    tempDirectories.push(projectRoot);
    const runLayout = new LocalRunLayout(projectRoot);

    const previewState = runLayout.createDarktableRuntimeState("preview-manifest-1-render-1");
    const smokeState = runLayout.createDarktableRuntimeState("smoke-manifest-2-smoke-2");

    expect(previewState).toEqual({
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
    });
    expect(smokeState.rootDirectory).not.toBe(previewState.rootDirectory);
    expect(smokeState.libraryPath).not.toBe(previewState.libraryPath);
    expect(existsSync(previewState.configDirectory)).toBe(true);
    expect(existsSync(previewState.cacheDirectory)).toBe(true);
    expect(existsSync(previewState.temporaryDirectory)).toBe(true);
    expect(existsSync(smokeState.configDirectory)).toBe(true);
    expect(existsSync(smokeState.cacheDirectory)).toBe(true);
    expect(existsSync(smokeState.temporaryDirectory)).toBe(true);
  });
});
