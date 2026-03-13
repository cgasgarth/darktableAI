import type { LiveModuleMaskResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";
import type { LiveDarktableApplyModuleMaskActionResult } from "../../application/models/live-darktable-module-mask";
import type { ApplyLiveDarktableModuleMaskActionRequest } from "../../application/use-cases/apply-live-darktable-module-mask-action";

interface ApplyLiveDarktableModuleMaskActionPort {
  execute(
    request: ApplyLiveDarktableModuleMaskActionRequest
  ): Promise<LiveDarktableApplyModuleMaskActionResult>;
}

export type RunLiveModuleMaskActionCommandInput =
  | {
      readonly requestId: string;
      readonly instanceKey: string;
      readonly action: "clear-mask";
    }
  | {
      readonly requestId: string;
      readonly instanceKey: string;
      readonly action: "reuse-same-shapes";
      readonly sourceInstanceKey: string;
    };

export class RunLiveModuleMaskActionCommand
  implements CliCommand<RunLiveModuleMaskActionCommandInput, LiveModuleMaskResponse>
{
  public constructor(
    private readonly applyLiveDarktableModuleMaskAction: ApplyLiveDarktableModuleMaskActionPort
  ) {}

  public async execute(
    input: RunLiveModuleMaskActionCommandInput
  ): Promise<CliCommandResult<LiveModuleMaskResponse>> {
    try {
      const response = await this.applyLiveDarktableModuleMaskAction.execute(
        input.action === "reuse-same-shapes"
          ? {
              instanceKey: input.instanceKey,
              action: input.action,
              sourceInstanceKey: input.sourceInstanceKey
            }
          : {
              instanceKey: input.instanceKey,
              action: input.action
            }
      );

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
            ...(response.latestSnapshot.moduleMask === undefined
              ? {}
              : { moduleMask: response.latestSnapshot.moduleMask }),
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
          moduleMask: response.latestSnapshot.moduleMask
        }
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown live module mask error."
      };
    }
  }
}
