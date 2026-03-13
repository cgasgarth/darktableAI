import type { DevelopRecipe } from "../../contracts/develop-recipe";
import type { DevelopRecipeValidationIssue } from "../../contracts/develop-recipe";
import type { AdjustmentCapabilityRegistry } from "../../contracts/adjustment-capability";
import type { DarktableNativeCapabilityRegistry } from "../../contracts/darktable-native-capability";
import type { DarktableRenderDiagnostics } from "../../application/models/render-artifacts";
import type {
  LiveDarktableActiveImage,
  LiveDarktableCommandDiagnostics,
  LiveDarktableExposureChange,
  LiveDarktableExposureState,
  LiveDarktableSessionState,
  LiveDarktableSetExposureWaitOutcome
} from "../../application/models/live-darktable";

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
  readonly darktableNative: DarktableNativeCapabilityRegistry;
}

interface LiveResponseCommon {
  readonly requestId: string;
  readonly bridgeVersion: 1;
  readonly status: "ok" | "unavailable";
}

export interface LiveSessionInfoResponse extends LiveResponseCommon {
  readonly diagnostics: LiveDarktableCommandDiagnostics;
  readonly reason?: "unsupported-view" | "no-active-image";
  readonly session?: LiveDarktableSessionState;
  readonly activeImage?: LiveDarktableActiveImage;
  readonly exposure?: LiveDarktableExposureState;
}

export interface LiveSetExposureResponse extends LiveResponseCommon {
  readonly diagnostics: ReadonlyArray<LiveDarktableCommandDiagnostics>;
  readonly wait: LiveDarktableSetExposureWaitOutcome;
  readonly reason?: "unsupported-view" | "no-active-image";
  readonly session?: LiveDarktableSessionState;
  readonly activeImage?: LiveDarktableActiveImage;
  readonly exposure?: LiveDarktableExposureState;
  readonly setExposure?: LiveDarktableExposureChange;
}
