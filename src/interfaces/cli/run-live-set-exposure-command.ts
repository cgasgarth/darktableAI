import type { LiveDarktableSetExposureResult } from "../../application/models/live-darktable";
import type { SetLiveDarktableExposureRequest } from "../../application/use-cases/set-live-darktable-exposure";
import type { LiveSetExposureResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";

interface SetLiveDarktableExposurePort {
  execute(request: SetLiveDarktableExposureRequest): Promise<LiveDarktableSetExposureResult>;
}

export type RunLiveSetExposureCommandInput =
  | {
      readonly requestId: string;
      readonly exposure: number;
      readonly wait: {
        readonly mode: "none";
      };
    }
  | {
      readonly requestId: string;
      readonly exposure: number;
      readonly wait: {
        readonly mode: "until-render";
        readonly timeoutMilliseconds: number;
        readonly pollIntervalMilliseconds: number;
      };
    };

export class RunLiveSetExposureCommand
  implements CliCommand<RunLiveSetExposureCommandInput, LiveSetExposureResponse>
{
  public constructor(private readonly setLiveDarktableExposure: SetLiveDarktableExposurePort) {}

  public async execute(
    input: RunLiveSetExposureCommandInput
  ): Promise<CliCommandResult<LiveSetExposureResponse>> {
    try {
      const request: SetLiveDarktableExposureRequest = input.wait.mode === "none"
        ? {
            exposure: input.exposure,
            wait: input.wait
          }
        : {
            exposure: input.exposure,
            wait: input.wait
          };
      const response = await this.setLiveDarktableExposure.execute(request);

      if (response.latestSession.status === "unavailable") {
        return {
          ok: true,
          output: {
            requestId: input.requestId,
            bridgeVersion: response.latestSession.bridgeVersion,
            status: response.latestSession.status,
            diagnostics: response.helperCallDiagnostics,
            wait: response.wait,
            ...(response.latestSession.reason === undefined ? {} : { reason: response.latestSession.reason })
          }
        };
      }

      return {
        ok: true,
        output: {
          requestId: input.requestId,
          bridgeVersion: response.latestSession.bridgeVersion,
          status: response.latestSession.status,
          diagnostics: response.helperCallDiagnostics,
          wait: response.wait,
          ...(response.mutation.status === "ok" ? { setExposure: response.mutation.exposure } : {}),
          session: response.latestSession.session,
          ...(response.latestSession.activeImage === undefined
            ? {}
            : { activeImage: response.latestSession.activeImage }),
          ...(response.latestSession.exposure === undefined ? {} : { exposure: response.latestSession.exposure })
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

    return "Unknown error while setting live darktable exposure.";
  }
}
