import type {
  LiveDarktableExposureMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";

export interface SetLiveDarktableExposureRequest {
  readonly exposure: number;
}

export interface LiveDarktableSessionGateway {
  getSession(): Promise<LiveDarktableSessionSnapshot>;
  getSnapshot(): Promise<LiveDarktableSnapshotReadback>;
  setExposure(request: SetLiveDarktableExposureRequest): Promise<LiveDarktableExposureMutation>;
}
