import type { LiveDarktableSessionSnapshot } from "../../application/models/live-darktable";
import type { GetLiveDarktableSessionRequest } from "../../application/use-cases/get-live-darktable-session";
import type { LiveSessionInfoResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";

interface GetLiveDarktableSessionPort {
  execute(request: GetLiveDarktableSessionRequest): Promise<LiveDarktableSessionSnapshot>;
}

export interface RunLiveSessionInfoCommandInput {
  readonly requestId: string;
}

export class RunLiveSessionInfoCommand
  implements CliCommand<RunLiveSessionInfoCommandInput, LiveSessionInfoResponse>
{
  public constructor(private readonly getLiveDarktableSession: GetLiveDarktableSessionPort) {}

  public async execute(
    input: RunLiveSessionInfoCommandInput
  ): Promise<CliCommandResult<LiveSessionInfoResponse>> {
    try {
      const response = await this.getLiveDarktableSession.execute({});

      if (response.status === "unavailable") {
        return {
          ok: true,
          output: {
            requestId: input.requestId,
            bridgeVersion: response.bridgeVersion,
            status: response.status,
            diagnostics: response.diagnostics,
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
          ...(response.activeImage === undefined ? {} : { activeImage: response.activeImage }),
          ...(response.exposure === undefined ? {} : { exposure: response.exposure })
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

    return "Unknown error while reading live darktable session.";
  }
}
