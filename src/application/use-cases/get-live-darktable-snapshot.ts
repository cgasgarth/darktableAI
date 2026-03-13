import type { LiveDarktableSnapshotReadback } from "../models/live-darktable";
import type { LiveDarktableSessionGateway } from "../ports/live-darktable-session-gateway";

export type GetLiveDarktableSnapshotRequest = Record<never, never>;

export class GetLiveDarktableSnapshot {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public execute(_request: GetLiveDarktableSnapshotRequest): Promise<LiveDarktableSnapshotReadback> {
    void _request;
    return this.gateway.getSnapshot();
  }
}
