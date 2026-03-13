import type {
  LiveDarktableApplyModuleInstanceActionResult,
  LiveDarktableModuleInstanceAction
} from "../models/live-darktable";
import type {
  ApplyLiveDarktableModuleInstanceActionRequest as GatewayApplyLiveDarktableModuleInstanceActionRequest,
  LiveDarktableSessionGateway
} from "../ports/live-darktable-session-gateway";

export interface ApplyLiveDarktableModuleInstanceActionRequest {
  readonly instanceKey: string;
  readonly action: LiveDarktableModuleInstanceAction;
}

export class ApplyLiveDarktableModuleInstanceAction {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public async execute(
    request: ApplyLiveDarktableModuleInstanceActionRequest
  ): Promise<LiveDarktableApplyModuleInstanceActionResult> {
    const mutationRequest: GatewayApplyLiveDarktableModuleInstanceActionRequest = {
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
