import type { DevelopRecipe } from "../../contracts/develop-recipe";
import type { DevelopRecipeValidationIssue } from "../../contracts/develop-recipe";
import type { AdjustmentCapabilityRegistry } from "../../contracts/adjustment-capability";
import type { DarktableRenderDiagnostics } from "../../application/models/render-artifacts";

export interface PreviewRenderRequest {
  readonly requestId: string;
  readonly recipe: DevelopRecipe;
}

export interface PreviewRenderSuccessResponse {
  readonly requestId: string;
  readonly status: "ok";
  readonly manifestId: string;
  readonly manifestPath: string;
  readonly outputImagePath: string;
  readonly sourceAssetPath: string;
  readonly compiledArtifactPath: string;
  readonly diagnostics: DarktableRenderDiagnostics;
}

export interface PreviewRenderFailureResponse {
  readonly requestId: string;
  readonly status: "validation-failed";
  readonly validationIssues: ReadonlyArray<DevelopRecipeValidationIssue>;
}

export type PreviewRenderResponse =
  | PreviewRenderSuccessResponse
  | PreviewRenderFailureResponse;

export interface SmokeTestRequest {
  readonly requestId: string;
  readonly fixtureId: string;
}

export interface SmokeTestSuccessResponse {
  readonly requestId: string;
  readonly status: "ok";
  readonly fixtureId: string;
  readonly outputImagePath: string;
  readonly manifestId: string;
  readonly manifestPath: string;
  readonly sourceAssetPath: string;
  readonly diagnostics: DarktableRenderDiagnostics;
}

export interface SmokeTestFailureResponse {
  readonly requestId: string;
  readonly status: "error";
  readonly message: string;
}

export type SmokeTestResponse =
  | SmokeTestSuccessResponse
  | SmokeTestFailureResponse;

export interface AdjustmentCapabilitiesResponse {
  readonly adjustments: AdjustmentCapabilityRegistry;
}
