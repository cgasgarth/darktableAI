export interface LiveDarktableCommandDiagnostics {
  readonly helperBinaryPath: string;
  readonly commandArguments: ReadonlyArray<string>;
  readonly exitCode: number;
  readonly elapsedMilliseconds: number;
}

export interface LiveDarktableSessionState {
  readonly view: string;
  readonly renderSequence: number;
  readonly historyChangeSequence: number;
  readonly imageLoadSequence: number;
}

export interface LiveDarktableActiveImage {
  readonly imageId: number;
  readonly directoryPath: string;
  readonly fileName: string;
  readonly sourceAssetPath: string;
}

export interface LiveDarktableExposureState {
  readonly current: number;
}

export interface LiveDarktableExposureChange {
  readonly previous: number;
  readonly requested: number;
  readonly current: number;
  readonly requestedRenderSequence: number;
}

interface LiveDarktableStateCommon {
  readonly bridgeVersion: 1;
  readonly status: "ok" | "unavailable";
  readonly diagnostics: LiveDarktableCommandDiagnostics;
}

export interface LiveDarktableUnavailableState extends LiveDarktableStateCommon {
  readonly status: "unavailable";
  readonly reason?: "unsupported-view" | "no-active-image";
}

export interface LiveDarktableAvailableSessionState extends LiveDarktableStateCommon {
  readonly status: "ok";
  readonly session: LiveDarktableSessionState;
  readonly activeImage?: LiveDarktableActiveImage;
  readonly exposure?: LiveDarktableExposureState;
}

export interface LiveDarktableAvailableExposureState extends LiveDarktableStateCommon {
  readonly status: "ok";
  readonly session: LiveDarktableSessionState;
  readonly activeImage?: LiveDarktableActiveImage;
  readonly exposure: LiveDarktableExposureChange;
}

export type LiveDarktableSessionSnapshot =
  | LiveDarktableAvailableSessionState
  | LiveDarktableUnavailableState;

export type LiveDarktableExposureMutation =
  | LiveDarktableAvailableExposureState
  | LiveDarktableUnavailableState;

export interface LiveDarktableSetExposureWaitPolicy {
  readonly mode: "none" | "until-render";
  readonly timeoutMilliseconds?: number;
  readonly pollIntervalMilliseconds?: number;
}

export interface LiveDarktableSetExposureWaitOutcome {
  readonly mode: "none" | "until-render";
  readonly targetRenderSequence?: number;
  readonly latestObservedRenderSequence?: number;
  readonly pollCount: number;
  readonly completed: boolean;
  readonly timedOut: boolean;
  readonly timeoutMilliseconds?: number;
  readonly pollIntervalMilliseconds?: number;
}

export interface LiveDarktableSetExposureResult {
  readonly mutation: LiveDarktableExposureMutation;
  readonly latestSession: LiveDarktableSessionSnapshot;
  readonly helperCallDiagnostics: ReadonlyArray<LiveDarktableCommandDiagnostics>;
  readonly wait: LiveDarktableSetExposureWaitOutcome;
}
