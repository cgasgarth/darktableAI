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

export interface LiveDarktableSnapshotControlRequirement {
  readonly activeImage: boolean;
  readonly view: string;
}

export interface LiveDarktableSnapshotControlValueType {
  readonly type: string;
  readonly minimum?: number;
  readonly maximum?: number;
}

export interface LiveDarktableSnapshotControl {
  readonly id: string;
  readonly module: string;
  readonly control: string;
  readonly operations: ReadonlyArray<string>;
  readonly requires: LiveDarktableSnapshotControlRequirement;
  readonly valueType: LiveDarktableSnapshotControlValueType;
  readonly value: unknown;
}

export type LiveDarktableSnapshotControls = ReadonlyArray<LiveDarktableSnapshotControl>;

export interface LiveDarktableSnapshotParamField {
  readonly path: string;
  readonly kind: string;
  readonly value: unknown;
}

export interface LiveDarktableSnapshotParamsIntrospection {
  readonly encoding: "introspection-v1";
  readonly fields: ReadonlyArray<LiveDarktableSnapshotParamField>;
}

export interface LiveDarktableSnapshotParamsUnsupported {
  readonly encoding: "unsupported";
}

export type LiveDarktableSnapshotParams =
  | LiveDarktableSnapshotParamsIntrospection
  | LiveDarktableSnapshotParamsUnsupported;

export interface LiveDarktableSnapshotModuleState {
  readonly instanceKey: string;
  readonly moduleOp: string;
  readonly enabled: boolean;
  readonly iopOrder: number;
  readonly multiPriority: number;
  readonly multiName: string;
  readonly params: LiveDarktableSnapshotParams;
}

export interface LiveDarktableSnapshotHistoryItem extends LiveDarktableSnapshotModuleState {
  readonly index: number;
  readonly applied: boolean;
}

export interface LiveDarktableSnapshotState {
  readonly appliedHistoryEnd: number;
  readonly controls: LiveDarktableSnapshotControls;
  readonly moduleStack: ReadonlyArray<LiveDarktableSnapshotModuleState>;
  readonly historyItems: ReadonlyArray<LiveDarktableSnapshotHistoryItem>;
}

interface LiveDarktableStateCommon {
  readonly bridgeVersion: 1;
  readonly status: "ok" | "unavailable";
  readonly diagnostics: LiveDarktableCommandDiagnostics;
}

export interface LiveDarktableUnavailableState extends LiveDarktableStateCommon {
  readonly status: "unavailable";
  readonly reason?: "unsupported-view" | "no-active-image";
  readonly session?: LiveDarktableSessionState;
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

export interface LiveDarktableAvailableSnapshotState extends LiveDarktableStateCommon {
  readonly status: "ok";
  readonly session: LiveDarktableSessionState;
  readonly activeImage: LiveDarktableActiveImage;
  readonly snapshot: LiveDarktableSnapshotState;
}

export type LiveDarktableSessionSnapshot =
  | LiveDarktableAvailableSessionState
  | LiveDarktableUnavailableState;

export type LiveDarktableExposureMutation =
  | LiveDarktableAvailableExposureState
  | LiveDarktableUnavailableState;

export type LiveDarktableSnapshotReadback =
  | LiveDarktableAvailableSnapshotState
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
