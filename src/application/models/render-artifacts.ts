export interface CompiledDevelopRecipe {
  readonly compileId: string;
  readonly recipeId: string;
  readonly sourceAssetPath: string;
  readonly compiledArtifactPath: string;
  readonly xmpSidecarPath: string;
  readonly modules: ReadonlyArray<CompiledDarktableModule>;
}

export interface CompiledDarktableModule {
  readonly operation: string;
  readonly modversion: number;
}

export interface PreviewRenderRequest {
  readonly manifestId: string;
  readonly renderId: string;
  readonly recipeId: string;
  readonly sourceAssetPath: string;
  readonly compiledRecipe: CompiledDevelopRecipe;
  readonly outputImagePath: string;
  readonly requestedAt: Date;
}

export interface PreviewRenderResult {
  readonly manifestId: string;
  readonly renderId: string;
  readonly outputImagePath: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly diagnostics: DarktableRenderDiagnostics;
}

export interface SmokePreviewRequest {
  readonly manifestId: string;
  readonly smokeTestId: string;
  readonly fixtureId: string;
  readonly sourceAssetPath: string;
  readonly outputImagePath: string;
  readonly requestedAt: Date;
}

export interface SmokePreviewResult {
  readonly manifestId: string;
  readonly smokeTestId: string;
  readonly outputImagePath: string;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly diagnostics: DarktableRenderDiagnostics;
}

export interface RawFixture {
  readonly fixtureId: string;
  readonly sourceAssetPath: string;
  readonly description: string;
}

interface RenderManifestCommon {
  readonly manifestId: string;
  readonly manifestPath: string;
  readonly createdAt: Date;
  readonly sourceAssetPath: string;
  readonly outputImagePath: string;
  readonly requestedAt: Date;
  readonly diagnostics: DarktableRenderDiagnostics;
}

export interface DarktableRenderDiagnostics {
  readonly binaryPath: string;
  readonly commandArguments: ReadonlyArray<string>;
  readonly runtimeState: DarktableRuntimeDiagnostics;
  readonly exitCode: number;
}

export interface DarktableRuntimeDiagnostics {
  readonly rootDirectory: string;
  readonly configDirectory: string;
  readonly cacheDirectory: string;
  readonly temporaryDirectory: string;
  readonly libraryPath: string;
}

export interface PreviewRenderManifest extends RenderManifestCommon {
  readonly kind: "preview";
  readonly recipeId: string;
  readonly renderId: string;
  readonly compileId: string;
  readonly compiledArtifactPath: string;
  readonly previewStartedAt: Date;
  readonly previewCompletedAt: Date;
}

export interface SmokeRenderManifest extends RenderManifestCommon {
  readonly kind: "smoke";
  readonly fixtureId: string;
  readonly smokeTestId: string;
  readonly smokeStartedAt: Date;
  readonly smokeCompletedAt: Date;
}

export type RenderManifest = PreviewRenderManifest | SmokeRenderManifest;

export interface ManifestSaveRequest<TManifest extends RenderManifest = RenderManifest> {
  readonly manifest: TManifest;
}
