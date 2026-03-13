import type { LiveDarktableSetModuleBlendResult } from "../models/live-darktable";
import type {
  LiveDarktableSessionGateway,
  SetLiveDarktableModuleBlendRequest as GatewaySetLiveDarktableModuleBlendRequest
} from "../ports/live-darktable-session-gateway";

export interface SetLiveDarktableModuleBlendRequest {
  readonly instanceKey: string;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly reverseOrder?: boolean;
}

export class SetLiveDarktableModuleBlend {
  public constructor(private readonly gateway: LiveDarktableSessionGateway) {}

  public async execute(
    request: SetLiveDarktableModuleBlendRequest
  ): Promise<LiveDarktableSetModuleBlendResult> {
    if (
      request.opacity === undefined &&
      request.blendMode === undefined &&
      request.reverseOrder === undefined
    ) {
      throw new Error(
        "SetLiveDarktableModuleBlend requires at least one of opacity, blendMode, or reverseOrder."
      );
    }

    const mutationRequest: GatewaySetLiveDarktableModuleBlendRequest = {
      instanceKey: request.instanceKey,
      ...(request.opacity === undefined ? {} : { opacity: request.opacity }),
      ...(request.blendMode === undefined ? {} : { blendMode: request.blendMode }),
      ...(request.reverseOrder === undefined ? {} : { reverseOrder: request.reverseOrder })
    };
    const mutation = await this.gateway.applyModuleInstanceBlend(mutationRequest);

    return {
      mutation,
      latestSnapshot: mutation,
      helperCallDiagnostics: [mutation.diagnostics]
    };
  }
}
