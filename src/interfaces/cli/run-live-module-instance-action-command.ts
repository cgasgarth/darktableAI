import type { LiveDarktableApplyModuleInstanceActionResult } from "../../application/models/live-darktable";
import type { ApplyLiveDarktableModuleInstanceActionRequest } from "../../application/use-cases/apply-live-darktable-module-instance-action";
import type { LiveModuleInstanceActionResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";

interface ApplyLiveDarktableModuleInstanceActionPort {
  execute(
    request: ApplyLiveDarktableModuleInstanceActionRequest
  ): Promise<LiveDarktableApplyModuleInstanceActionResult>;
}

export interface RunLiveModuleInstanceActionCommandInput {
  readonly requestId: string;
  readonly instanceKey: string;
  readonly action: "enable" | "disable";
}

export class RunLiveModuleInstanceActionCommand
  implements CliCommand<RunLiveModuleInstanceActionCommandInput, LiveModuleInstanceActionResponse>
{
  public constructor(
    private readonly applyLiveDarktableModuleInstanceAction: ApplyLiveDarktableModuleInstanceActionPort
  ) {}

  public async execute(
    input: RunLiveModuleInstanceActionCommandInput
  ): Promise<CliCommandResult<LiveModuleInstanceActionResponse>> {
    try {
      const response = await this.applyLiveDarktableModuleInstanceAction.execute({
        instanceKey: input.instanceKey,
        action: input.action
      });

      if (response.latestSnapshot.status === "unavailable") {
        return {
          ok: true,
          output: {
            requestId: input.requestId,
            bridgeVersion: response.latestSnapshot.bridgeVersion,
            status: response.latestSnapshot.status,
            diagnostics: response.helperCallDiagnostics,
            ...(response.latestSnapshot.session === undefined
              ? {}
              : { session: response.latestSnapshot.session }),
            ...(response.latestSnapshot.activeImage === undefined
              ? {}
              : { activeImage: response.latestSnapshot.activeImage }),
            ...(response.latestSnapshot.moduleAction === undefined
              ? {}
              : { moduleAction: response.latestSnapshot.moduleAction }),
            ...(response.latestSnapshot.reason === undefined
              ? {}
              : { reason: response.latestSnapshot.reason })
          }
        };
      }

      return {
        ok: true,
        output: {
          requestId: input.requestId,
          bridgeVersion: response.latestSnapshot.bridgeVersion,
          status: response.latestSnapshot.status,
          diagnostics: response.helperCallDiagnostics,
          session: response.latestSnapshot.session,
          activeImage: response.latestSnapshot.activeImage,
          snapshot: response.latestSnapshot.snapshot,
          ...(response.mutation.status === "ok"
            ? { moduleAction: response.mutation.moduleAction }
            : {})
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

    return "Unknown error while applying live darktable module-instance action.";
  }
}
