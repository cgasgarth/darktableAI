import type {
  LiveDarktableModuleInstanceAction,
  LiveDarktableModuleInstanceActionMutation,
  LiveDarktableExposureMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";

export interface SetLiveDarktableExposureRequest {
  readonly exposure: number;
}

export interface ApplyLiveDarktableModuleInstanceActionRequest {
  readonly instanceKey: string;
  readonly action: LiveDarktableModuleInstanceAction;
}

export interface LiveDarktableSessionGateway {
  getSession(): Promise<LiveDarktableSessionSnapshot>;
  getSnapshot(): Promise<LiveDarktableSnapshotReadback>;
  setExposure(request: SetLiveDarktableExposureRequest): Promise<LiveDarktableExposureMutation>;
  applyModuleInstanceAction(
    request: ApplyLiveDarktableModuleInstanceActionRequest
  ): Promise<LiveDarktableModuleInstanceActionMutation>;
}
