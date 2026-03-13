import type {
  LiveDarktableActiveImage,
  LiveDarktableCommandDiagnostics,
  LiveDarktableSessionState,
  LiveDarktableSnapshotState
} from "./live-darktable";

export type LiveDarktableModuleMaskAction = "clear-mask" | "reuse-same-shapes";

export type LiveDarktableModuleMaskUnavailableReason =
  | "unsupported-view"
  | "no-active-image"
  | "unknown-instance-key"
  | "unknown-source-instance-key"
  | "unsupported-module-mask"
  | "source-module-mask-unavailable"
  | "target-module-mask-not-clear"
  | "module-mask-failed"
  | "snapshot-unavailable";

export interface LiveDarktableModuleMaskForm {
  readonly formId: number;
  readonly state: number;
  readonly opacity: number;
}

export interface LiveDarktableModuleMaskResult {
  readonly targetInstanceKey: string;
  readonly action: LiveDarktableModuleMaskAction;
  readonly sourceInstanceKey?: string;
  readonly moduleOp: string;
  readonly iopOrder: number;
  readonly multiPriority: number;
  readonly multiName: string;
  readonly previousHasMask: boolean;
  readonly currentHasMask: boolean;
  readonly changed: boolean;
  readonly previousForms: ReadonlyArray<LiveDarktableModuleMaskForm>;
  readonly sourceForms: ReadonlyArray<LiveDarktableModuleMaskForm>;
  readonly currentForms: ReadonlyArray<LiveDarktableModuleMaskForm>;
  readonly historyBefore: number;
  readonly historyAfter: number;
  readonly requestedHistoryEnd: number;
}

export interface LiveDarktableUnavailableModuleMaskResult {
  readonly targetInstanceKey: string;
  readonly action: string;
  readonly sourceInstanceKey?: string;
  readonly moduleOp?: string;
  readonly iopOrder?: number;
  readonly multiPriority?: number;
  readonly multiName?: string;
  readonly previousHasMask?: boolean;
  readonly currentHasMask?: boolean;
  readonly changed?: boolean;
  readonly previousForms?: ReadonlyArray<LiveDarktableModuleMaskForm>;
  readonly sourceForms?: ReadonlyArray<LiveDarktableModuleMaskForm>;
  readonly currentForms?: ReadonlyArray<LiveDarktableModuleMaskForm>;
  readonly historyBefore?: number;
  readonly historyAfter?: number;
  readonly requestedHistoryEnd?: number;
}

export interface LiveDarktableAvailableModuleMaskState {
  readonly bridgeVersion: 1;
  readonly status: "ok";
  readonly diagnostics: LiveDarktableCommandDiagnostics;
  readonly session: LiveDarktableSessionState;
  readonly activeImage: LiveDarktableActiveImage;
  readonly moduleMask: LiveDarktableModuleMaskResult;
  readonly snapshot: LiveDarktableSnapshotState;
}

export interface LiveDarktableUnavailableModuleMaskState {
  readonly bridgeVersion: 1;
  readonly status: "unavailable";
  readonly diagnostics: LiveDarktableCommandDiagnostics;
  readonly reason?: LiveDarktableModuleMaskUnavailableReason;
  readonly session?: LiveDarktableSessionState;
  readonly activeImage?: LiveDarktableActiveImage;
  readonly moduleMask?: LiveDarktableUnavailableModuleMaskResult;
}

export type LiveDarktableModuleMaskMutation =
  | LiveDarktableAvailableModuleMaskState
  | LiveDarktableUnavailableModuleMaskState;

export interface LiveDarktableApplyModuleMaskActionResult {
  readonly mutation: LiveDarktableModuleMaskMutation;
  readonly latestSnapshot: LiveDarktableModuleMaskMutation;
  readonly helperCallDiagnostics: ReadonlyArray<LiveDarktableCommandDiagnostics>;
}
