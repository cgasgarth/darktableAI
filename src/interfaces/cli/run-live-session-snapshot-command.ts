import type { LiveDarktableSnapshotReadback } from "../../application/models/live-darktable";
import type { GetLiveDarktableSnapshotRequest } from "../../application/use-cases/get-live-darktable-snapshot";
import type { LiveSessionSnapshotResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";

interface GetLiveDarktableSnapshotPort {
  execute(request: GetLiveDarktableSnapshotRequest): Promise<LiveDarktableSnapshotReadback>;
}

export interface RunLiveSessionSnapshotCommandInput {
  readonly requestId: string;
}

export class RunLiveSessionSnapshotCommand
  implements CliCommand<RunLiveSessionSnapshotCommandInput, LiveSessionSnapshotResponse>
{
  public constructor(private readonly getLiveDarktableSnapshot: GetLiveDarktableSnapshotPort) {}

  public async execute(
    input: RunLiveSessionSnapshotCommandInput
  ): Promise<CliCommandResult<LiveSessionSnapshotResponse>> {
    try {
      const response = await this.getLiveDarktableSnapshot.execute({});

      if (response.status === "unavailable") {
        return {
          ok: true,
          output: {
            requestId: input.requestId,
            bridgeVersion: response.bridgeVersion,
            status: response.status,
            diagnostics: response.diagnostics,
            ...(response.session === undefined ? {} : { session: response.session }),
            ...(response.reason === undefined ? {} : { reason: response.reason })
          }
        };
      }

      return {
        ok: true,
        output: {
          requestId: input.requestId,
          bridgeVersion: response.bridgeVersion,
          status: response.status,
          diagnostics: response.diagnostics,
          session: response.session,
          activeImage: response.activeImage,
          snapshot: response.snapshot
        }
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: this.formatFailure(error)
      };
    }
  }

  private formatFailure(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error while reading live darktable snapshot.";
  }
}
