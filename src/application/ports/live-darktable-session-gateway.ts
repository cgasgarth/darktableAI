import type {
  LiveDarktableDeleteModuleInstanceAction,
  LiveDarktableForkModuleInstanceAction,
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableReorderModuleInstanceAction,
  LiveDarktableToggleModuleInstanceAction,
  LiveDarktableExposureMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";

export interface SetLiveDarktableExposureRequest {
  readonly exposure: number;
}

export type ApplyLiveDarktableModuleInstanceActionRequest =
  | {
      readonly instanceKey: string;
      readonly action:
        | LiveDarktableToggleModuleInstanceAction
        | LiveDarktableForkModuleInstanceAction
        | LiveDarktableDeleteModuleInstanceAction;
    }
  | {
      readonly instanceKey: string;
      readonly action: LiveDarktableReorderModuleInstanceAction;
      readonly anchorInstanceKey: string;
    };

export interface LiveDarktableSessionGateway {
  getSession(): Promise<LiveDarktableSessionSnapshot>;
  getSnapshot(): Promise<LiveDarktableSnapshotReadback>;
  setExposure(request: SetLiveDarktableExposureRequest): Promise<LiveDarktableExposureMutation>;
  applyModuleInstanceAction(
    request: ApplyLiveDarktableModuleInstanceActionRequest
  ): Promise<LiveDarktableModuleInstanceActionMutation>;
}
