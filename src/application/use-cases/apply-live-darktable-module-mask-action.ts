import type { LiveDarktableApplyModuleMaskActionResult } from "../models/live-darktable-module-mask";
import type {
  ApplyLiveDarktableModuleMaskActionRequest as GatewayApplyLiveDarktableModuleMaskActionRequest,
  LiveDarktableSessionGateway
} from "../ports/live-darktable-session-gateway";

export type ApplyLiveDarktableModuleMaskActionRequest =
  | {
      readonly instanceKey: string;
      readonly action: "clear-mask";
    }
  | {
      readonly instanceKey: string;
      readonly action: "reuse-same-shapes";
      readonly sourceInstanceKey: string;
    };

export class ApplyLiveDarktableModuleMaskAction {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public async execute(
    request: ApplyLiveDarktableModuleMaskActionRequest
  ): Promise<LiveDarktableApplyModuleMaskActionResult> {
    const mutationRequest: GatewayApplyLiveDarktableModuleMaskActionRequest =
      request.action === "reuse-same-shapes"
        ? {
            instanceKey: request.instanceKey,
            action: request.action,
            sourceInstanceKey: request.sourceInstanceKey
          }
        : {
            instanceKey: request.instanceKey,
            action: request.action
          };
    const mutation = await this.gateway.applyModuleInstanceMask(mutationRequest);

    return {
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [mutation.diagnostics]
    };
  }
}
