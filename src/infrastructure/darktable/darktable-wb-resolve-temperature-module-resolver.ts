import path from "node:path";

import type {
  ResolveTemperatureModuleRequest,
  ResolvedTemperatureModuleParams,
  TemperatureModuleResolver
} from "../../application/ports/temperature-module-resolver";
import {
  BunDarktableCliProcessRunner,
  type DarktableCliProcessRunner
} from "./darktable-cli-process-runner";

interface WhiteBalanceResolvePayload {
  readonly params?: {
    readonly red?: unknown;
    readonly green?: unknown;
    readonly blue?: unknown;
    readonly various?: unknown;
    readonly preset?: unknown;
  };
}

export interface DarktableWbResolveRuntime {
  readonly binaryPath: string;
  readonly coreOptions: ReadonlyArray<string>;
}

export class DarktableWbResolveTemperatureModuleResolver
  implements TemperatureModuleResolver
{
  public constructor(
    private readonly runtime: DarktableWbResolveRuntime =
      DarktableWbResolveTemperatureModuleResolver.createDefaultRuntime(),
    private readonly processRunner: DarktableCliProcessRunner = new BunDarktableCliProcessRunner()
  ) {}

  public async resolve(
    request: ResolveTemperatureModuleRequest
  ): Promise<ResolvedTemperatureModuleParams> {
    const command = [
      this.runtime.binaryPath,
      request.sourceAssetPath,
      String(request.temperature),
      String(request.tint),
      "--core",
      ...this.runtime.coreOptions
    ];
    const { exitCode, stdout, stderr } = await this.processRunner.run(command);

    if (exitCode !== 0) {
      const output = `${stdout}\n${stderr}`.trim();
      throw new Error(
        output.length > 0
          ? `darktable-wb-resolve failed (code=${String(exitCode)}): ${output}`
          : `darktable-wb-resolve failed (code=${String(exitCode)}): no diagnostic output.`
      );
    }

    return this.parseResolvedParams(stdout);
  }

  public static createDefaultRuntime(): DarktableWbResolveRuntime {
    const darktableBuildRoot = path.resolve(import.meta.dir, "../../../../darktable/build");

    return {
      binaryPath: path.resolve(darktableBuildRoot, "bin", "darktable-wb-resolve"),
      coreOptions: ["--datadir", path.resolve(darktableBuildRoot, "share", "darktable"), "--conf", "opencl=FALSE"]
    };
  }

  private parseResolvedParams(stdout: string): ResolvedTemperatureModuleParams {
    let parsed: WhiteBalanceResolvePayload;

    try {
      parsed = JSON.parse(stdout) as WhiteBalanceResolvePayload;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown JSON parse error.";
      throw new Error(`darktable-wb-resolve returned invalid JSON: ${message}`);
    }

    const params = parsed.params;

    if (params === undefined) {
      throw new Error("darktable-wb-resolve response omitted params.");
    }

    return {
      red: this.readNumber(params.red, "params.red"),
      green: this.readNumber(params.green, "params.green"),
      blue: this.readNumber(params.blue, "params.blue"),
      various: this.readNumber(params.various, "params.various"),
      preset: this.readInteger(params.preset, "params.preset")
    };
  }

  private readInteger(value: unknown, label: string): number {
    const parsed = this.readNumber(value, label);

    if (!Number.isInteger(parsed)) {
      throw new Error(`darktable-wb-resolve field '${label}' must be an integer.`);
    }

    return parsed;
  }

  private readNumber(value: unknown, label: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`darktable-wb-resolve field '${label}' must be a finite number.`);
    }

    return value;
  }
}
