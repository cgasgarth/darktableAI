import { mkdirSync } from "node:fs";
import path from "node:path";

import type { PreviewArtifactLayout } from "../../application/ports/preview-artifact-layout";

export interface DarktableRuntimeState {
  readonly rootDirectory: string;
  readonly configDirectory: string;
  readonly cacheDirectory: string;
  readonly temporaryDirectory: string;
  readonly libraryPath: string;
}

export class LocalRunLayout implements PreviewArtifactLayout {
  private readonly artifactsRoot: string;
  private readonly previewDirectory: string;
  private readonly previewRecipeDirectory: string;
  private readonly smokeDirectory: string;
  private readonly manifestsDirectory: string;
  private readonly darktableRuntimeDirectory: string;

  public constructor(projectRoot: string = path.resolve(import.meta.dir, "../../..")) {
    this.artifactsRoot = path.resolve(projectRoot, "artifacts");
    this.previewDirectory = path.resolve(this.artifactsRoot, "preview");
    this.previewRecipeDirectory = path.resolve(this.previewDirectory, "recipes");
    this.smokeDirectory = path.resolve(this.artifactsRoot, "smoke");
    this.manifestsDirectory = path.resolve(this.artifactsRoot, "manifests");
    this.darktableRuntimeDirectory = path.resolve(this.artifactsRoot, "runtime", "darktable");
  }

  public getManifestPath(manifestId: string, filename?: string): string {
    const safeFileName = filename ?? `${manifestId}.json`;
    this.ensureDirectory(this.manifestsDirectory);
    return path.resolve(this.manifestsDirectory, safeFileName);
  }

  public getPreviewOutputPath(manifestId: string): string {
    this.ensureDirectory(this.previewDirectory);
    return path.resolve(this.previewDirectory, `${manifestId}-preview.jpg`);
  }

  public getPreviewRecipeSidecarPath(compileId: string): string {
    this.ensureDirectory(this.previewRecipeDirectory);
    return path.resolve(this.previewRecipeDirectory, `${compileId}.xmp`);
  }

  public getSmokeOutputPath(manifestId: string, smokeTestId?: string): string {
    this.ensureDirectory(this.smokeDirectory);

    const suffix = smokeTestId === undefined ? manifestId : `${manifestId}-${smokeTestId}`;
    return path.resolve(this.smokeDirectory, `${suffix}-smoke.jpg`);
  }

  public createDarktableRuntimeState(runId: string): DarktableRuntimeState {
    const runtimeRoot = path.resolve(this.darktableRuntimeDirectory, runId);
    const configDirectory = path.resolve(runtimeRoot, "config");
    const cacheDirectory = path.resolve(runtimeRoot, "cache");
    const temporaryDirectory = path.resolve(runtimeRoot, "tmp");

    this.ensureDirectory(configDirectory);
    this.ensureDirectory(cacheDirectory);
    this.ensureDirectory(temporaryDirectory);

    return {
      rootDirectory: runtimeRoot,
      configDirectory,
      cacheDirectory,
      temporaryDirectory,
      libraryPath: path.resolve(runtimeRoot, "library.db")
    };
  }

  private ensureDirectory(directoryPath: string): void {
    mkdirSync(directoryPath, { recursive: true });
  }
}
