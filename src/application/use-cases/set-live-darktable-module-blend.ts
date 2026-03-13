import type { LiveDarktableSetModuleBlendResult } from "../models/live-darktable";
import type {
  LiveDarktableSessionGateway,
  SetLiveDarktableModuleBlendRequest as GatewaySetLiveDarktableModuleBlendRequest
} from "../ports/live-darktable-session-gateway";

export interface SetLiveDarktableModuleBlendRequest {
  readonly instanceKey: string;
  readonly opacity: number;
}

export class SetLiveDarktableModuleBlend {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public async execute(
    request: SetLiveDarktableModuleBlendRequest
  ): Promise<LiveDarktableSetModuleBlendResult> {
    const mutationRequest: GatewaySetLiveDarktableModuleBlendRequest = {
      instanceKey: request.instanceKey,
      opacity: request.opacity
    };
    const mutation = await this.gateway.applyModuleInstanceBlend(mutationRequest);

    return {
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [mutation.diagnostics]
    };
  }
}
