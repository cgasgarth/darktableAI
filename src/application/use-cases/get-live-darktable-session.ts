import type { LiveDarktableSessionSnapshot } from "../models/live-darktable";
import type { LiveDarktableSessionGateway } from "../ports/live-darktable-session-gateway";

export type GetLiveDarktableSessionRequest = Record<never, never>;

export class GetLiveDarktableSession {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public execute(_request: GetLiveDarktableSessionRequest): Promise<LiveDarktableSessionSnapshot> {
    void _request;
    return this.gateway.getSession();
  }
}
