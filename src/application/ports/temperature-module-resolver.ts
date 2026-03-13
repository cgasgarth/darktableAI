export interface ResolveTemperatureModuleRequest {
  readonly sourceAssetPath: string;
  readonly temperature: number;
  readonly tint: number;
}

export interface ResolvedTemperatureModuleParams {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  readonly various: number;
  readonly preset: number;
}

export interface TemperatureModuleResolver {
  resolve(
    request: ResolveTemperatureModuleRequest
  ): Promise<ResolvedTemperatureModuleParams>;
}
