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

export interface LiveDarktableUnsupportedModuleBlendState {
  readonly supported: false;
  readonly masksSupported: boolean;
}

export interface LiveDarktableSupportedModuleBlendState {
  readonly supported: true;
  readonly masksSupported: boolean;
  readonly opacity: number;
  readonly blendMode: string;
  readonly reverseOrder: boolean;
}

export type LiveDarktableSnapshotModuleBlend =
  | LiveDarktableUnsupportedModuleBlendState
  | LiveDarktableSupportedModuleBlendState;

export interface LiveDarktableSnapshotModuleState {
  readonly instanceKey: string;
  readonly moduleOp: string;
  readonly enabled: boolean;
  readonly iopOrder: number;
  readonly multiPriority: number;
  readonly multiName: string;
  readonly blend: LiveDarktableSnapshotModuleBlend;
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

export type LiveDarktableUnavailableReason =
  | "unsupported-view"
  | "no-active-image"
  | "unknown-instance-key"
  | "unknown-anchor-instance-key"
  | "unsupported-module-blend"
  | "unsupported-module-action"
  | "unsupported-module-state"
  | "module-action-failed"
  | "module-blend-failed"
  | "module-delete-blocked-last-instance"
  | "module-reorder-blocked-by-fence"
  | "module-reorder-blocked-by-rule"
  | "module-reorder-no-op"
  | "snapshot-unavailable";

export interface LiveDarktableModuleBlendResult {
  readonly targetInstanceKey: string;
  readonly moduleOp: string;
  readonly iopOrder: number;
  readonly multiPriority: number;
  readonly multiName: string;
  readonly previousOpacity: number;
  readonly requestedOpacity: number;
  readonly currentOpacity: number;
  readonly historyBefore: number;
  readonly historyAfter: number;
  readonly requestedHistoryEnd: number;
}

export interface LiveDarktableUnavailableModuleBlendResult {
  readonly targetInstanceKey: string;
  readonly moduleOp?: string;
  readonly iopOrder?: number;
  readonly multiPriority?: number;
  readonly multiName?: string;
  readonly previousOpacity?: number;
  readonly requestedOpacity?: number;
  readonly currentOpacity?: number;
  readonly historyBefore?: number;
  readonly historyAfter?: number;
  readonly requestedHistoryEnd?: number;
}

export type LiveDarktableToggleModuleInstanceAction = "enable" | "disable";

export type LiveDarktableForkModuleInstanceAction = "create" | "duplicate";

export type LiveDarktableDeleteModuleInstanceAction = "delete";

export type LiveDarktableReorderModuleInstanceAction = "move-before" | "move-after";

export type LiveDarktableModuleInstanceAction =
  | LiveDarktableToggleModuleInstanceAction
  | LiveDarktableForkModuleInstanceAction
  | LiveDarktableDeleteModuleInstanceAction
  | LiveDarktableReorderModuleInstanceAction;

interface LiveDarktableModuleInstanceActionResultCommon {
  readonly targetInstanceKey: string;
  readonly action: LiveDarktableModuleInstanceAction;
  readonly moduleOp: string;
  readonly iopOrder: number;
  readonly multiPriority: number;
  readonly multiName: string;
  readonly historyBefore: number;
  readonly historyAfter: number;
  readonly requestedHistoryEnd: number;
}

export interface LiveDarktableToggleModuleInstanceActionResult
  extends LiveDarktableModuleInstanceActionResultCommon {
  readonly action: LiveDarktableToggleModuleInstanceAction;
  readonly requestedEnabled: boolean;
  readonly previousEnabled: boolean;
  readonly currentEnabled: boolean;
  readonly changed: boolean;
}

export interface LiveDarktableForkModuleInstanceActionResult
  extends LiveDarktableModuleInstanceActionResultCommon {
  readonly action: LiveDarktableForkModuleInstanceAction;
  readonly resultInstanceKey: string;
}

export interface LiveDarktableDeleteModuleInstanceActionResult
  extends LiveDarktableModuleInstanceActionResultCommon {
  readonly action: LiveDarktableDeleteModuleInstanceAction;
  readonly replacementInstanceKey?: string;
  readonly replacementIopOrder?: number;
  readonly replacementMultiPriority?: number;
  readonly replacementMultiName?: string;
}

export interface LiveDarktableReorderModuleInstanceActionResult
  extends LiveDarktableModuleInstanceActionResultCommon {
  readonly action: LiveDarktableReorderModuleInstanceAction;
  readonly anchorInstanceKey: string;
  readonly previousIopOrder: number;
  readonly currentIopOrder: number;
}

export type LiveDarktableModuleInstanceActionResult =
  | LiveDarktableToggleModuleInstanceActionResult
  | LiveDarktableForkModuleInstanceActionResult
  | LiveDarktableDeleteModuleInstanceActionResult
  | LiveDarktableReorderModuleInstanceActionResult;

export interface LiveDarktableUnavailableModuleInstanceActionResult {
  readonly targetInstanceKey: string;
  readonly action: string;
  readonly anchorInstanceKey?: string;
  readonly requestedEnabled?: boolean;
  readonly resultInstanceKey?: string;
  readonly replacementInstanceKey?: string;
  readonly moduleOp?: string;
  readonly iopOrder?: number;
  readonly multiPriority?: number;
  readonly multiName?: string;
  readonly replacementIopOrder?: number;
  readonly replacementMultiPriority?: number;
  readonly replacementMultiName?: string;
  readonly previousIopOrder?: number;
  readonly currentIopOrder?: number;
  readonly previousEnabled?: boolean;
  readonly currentEnabled?: boolean;
  readonly changed?: boolean;
  readonly historyBefore?: number;
  readonly historyAfter?: number;
  readonly requestedHistoryEnd?: number;
}

interface LiveDarktableStateCommon {
  readonly bridgeVersion: 1;
  readonly status: "ok" | "unavailable";
  readonly diagnostics: LiveDarktableCommandDiagnostics;
}

export interface LiveDarktableUnavailableState extends LiveDarktableStateCommon {
  readonly status: "unavailable";
  readonly reason?: LiveDarktableUnavailableReason;
  readonly session?: LiveDarktableSessionState;
  readonly activeImage?: LiveDarktableActiveImage;
  readonly moduleAction?: LiveDarktableUnavailableModuleInstanceActionResult;
  readonly moduleBlend?: LiveDarktableUnavailableModuleBlendResult;
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

export interface LiveDarktableAvailableModuleInstanceActionState extends LiveDarktableStateCommon {
  readonly status: "ok";
  readonly session: LiveDarktableSessionState;
  readonly activeImage: LiveDarktableActiveImage;
  readonly moduleAction: LiveDarktableModuleInstanceActionResult;
  readonly snapshot: LiveDarktableSnapshotState;
}

export interface LiveDarktableAvailableModuleBlendState extends LiveDarktableStateCommon {
  readonly status: "ok";
  readonly session: LiveDarktableSessionState;
  readonly activeImage: LiveDarktableActiveImage;
  readonly moduleBlend: LiveDarktableModuleBlendResult;
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

export type LiveDarktableModuleInstanceActionMutation =
  | LiveDarktableAvailableModuleInstanceActionState
  | LiveDarktableUnavailableState;

export type LiveDarktableModuleBlendMutation =
  | LiveDarktableAvailableModuleBlendState
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

export interface LiveDarktableApplyModuleInstanceActionResult {
  readonly mutation: LiveDarktableModuleInstanceActionMutation;
  readonly latestSnapshot: LiveDarktableSnapshotReadback;
  readonly helperCallDiagnostics: ReadonlyArray<LiveDarktableCommandDiagnostics>;
}

export interface LiveDarktableSetModuleBlendResult {
  readonly mutation: LiveDarktableModuleBlendMutation;
  readonly latestSnapshot: LiveDarktableSnapshotReadback;
  readonly helperCallDiagnostics: ReadonlyArray<LiveDarktableCommandDiagnostics>;
}
