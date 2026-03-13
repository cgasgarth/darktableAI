import type {
  LiveDarktableDeleteModuleInstanceAction,
  LiveDarktableForkModuleInstanceAction,
  LiveDarktableModuleBlendMutation,
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableReorderModuleInstanceAction,
  LiveDarktableToggleModuleInstanceAction,
  LiveDarktableExposureMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";
import type {
  LiveDarktableModuleMaskAction,
  LiveDarktableModuleMaskMutation
} from "../models/live-darktable-module-mask";

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

export interface SetLiveDarktableModuleBlendRequest {
  readonly instanceKey: string;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly reverseOrder?: boolean;
}

export type ApplyLiveDarktableModuleMaskActionRequest =
  | {
      readonly instanceKey: string;
      readonly action: "clear-mask";
    }
  | {
      readonly instanceKey: string;
      readonly action: Extract<LiveDarktableModuleMaskAction, "reuse-same-shapes">;
      readonly sourceInstanceKey: string;
    };

export interface LiveDarktableSessionGateway {
  getSession(): Promise<LiveDarktableSessionSnapshot>;
  getSnapshot(): Promise<LiveDarktableSnapshotReadback>;
  setExposure(request: SetLiveDarktableExposureRequest): Promise<LiveDarktableExposureMutation>;
  applyModuleInstanceBlend(request: SetLiveDarktableModuleBlendRequest): Promise<LiveDarktableModuleBlendMutation>;
  applyModuleInstanceMask(
    request: ApplyLiveDarktableModuleMaskActionRequest
  ): Promise<LiveDarktableModuleMaskMutation>;
  applyModuleInstanceAction(
    request: ApplyLiveDarktableModuleInstanceActionRequest
  ): Promise<LiveDarktableModuleInstanceActionMutation>;
}
