import type { LiveDarktableSetModuleBlendResult } from "../../application/models/live-darktable";
import type { SetLiveDarktableModuleBlendRequest } from "../../application/use-cases/set-live-darktable-module-blend";
import type { LiveModuleBlendResponse } from "../api/http-contracts";
import type { CliCommand, CliCommandResult } from "./cli-command";

interface SetLiveDarktableModuleBlendPort {
  execute(request: SetLiveDarktableModuleBlendRequest): Promise<LiveDarktableSetModuleBlendResult>;
}

export interface RunLiveSetModuleBlendCommandInput {
  readonly requestId: string;
  readonly instanceKey: string;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly reverseOrder?: boolean;
}

export class RunLiveSetModuleBlendCommand
  implements CliCommand<RunLiveSetModuleBlendCommandInput, LiveModuleBlendResponse>
{
  public constructor(
    private readonly setLiveDarktableModuleBlend: SetLiveDarktableModuleBlendPort
  ) {}

  public async execute(
    input: RunLiveSetModuleBlendCommandInput
  ): Promise<CliCommandResult<LiveModuleBlendResponse>> {
    try {
      const response = await this.setLiveDarktableModuleBlend.execute({
        instanceKey: input.instanceKey,
        ...(input.opacity === undefined ? {} : { opacity: input.opacity }),
        ...(input.blendMode === undefined ? {} : { blendMode: input.blendMode }),
        ...(input.reverseOrder === undefined ? {} : { reverseOrder: input.reverseOrder })
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
            ...(response.latestSnapshot.moduleBlend === undefined
              ? {}
              : { moduleBlend: response.latestSnapshot.moduleBlend }),
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
            ? { moduleBlend: response.mutation.moduleBlend }
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

    return "Unknown error while applying live darktable module blend.";
  }
}
