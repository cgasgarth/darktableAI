import type {
  LiveDarktableDeleteModuleInstanceAction,
  LiveDarktableApplyModuleInstanceActionResult,
  LiveDarktableForkModuleInstanceAction,
  LiveDarktableReorderModuleInstanceAction,
  LiveDarktableToggleModuleInstanceAction
} from "../models/live-darktable";
import type {
  ApplyLiveDarktableModuleInstanceActionRequest as GatewayApplyLiveDarktableModuleInstanceActionRequest,
  LiveDarktableSessionGateway
} from "../ports/live-darktable-session-gateway";

export type ApplyLiveDarktableModuleInstanceActionRequest =
  | {
      readonly instanceKey: string;
      readonly action:
        | LiveDarktableToggleModuleInstanceAction
        | LiveDarktableForkModuleInstanceAction
        | LiveDarktableDeleteModuleInstanceAction;
    }
  | {
      readonly instanceKey: string;
      readonly action: LiveDarktableReorderModuleInstanceAction;
      readonly anchorInstanceKey: string;
    };

export class ApplyLiveDarktableModuleInstanceAction {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public async execute(
    request: ApplyLiveDarktableModuleInstanceActionRequest
  ): Promise<LiveDarktableApplyModuleInstanceActionResult> {
    const mutationRequest: GatewayApplyLiveDarktableModuleInstanceActionRequest =
      request.action === "move-before" || request.action === "move-after"
        ? {
            instanceKey: request.instanceKey,
            action: request.action,
            anchorInstanceKey: request.anchorInstanceKey
          }
        : {
            instanceKey: request.instanceKey,
            action: request.action
          };
    const mutation = await this.gateway.applyModuleInstanceAction(mutationRequest);

    if (mutation.status === "unavailable") {
      return {
        mutation,
        latestSnapshot: mutation,
        helperCallDiagnostics: [mutation.diagnostics]
      };
    }

    return {
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [mutation.diagnostics]
    };
  }
}
