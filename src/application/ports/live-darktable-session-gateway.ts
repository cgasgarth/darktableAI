import type {
  LiveDarktableExposureMutation,
  LiveDarktableSessionSnapshot
} from "../models/live-darktable";

export interface SetLiveDarktableExposureRequest {
  readonly exposure: number;
}

export interface LiveDarktableSessionGateway {
  getSession(): Promise<LiveDarktableSessionSnapshot>;
  setExposure(request: SetLiveDarktableExposureRequest): Promise<LiveDarktableExposureMutation>;
}
