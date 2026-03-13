import path from "node:path";

import type {
  LiveDarktableCommandDiagnostics,
  LiveDarktableExposureMutation,
  LiveDarktableSnapshotReadback,
  LiveDarktableSessionSnapshot
} from "../../application/models/live-darktable";
import type {
  LiveDarktableSessionGateway,
  SetLiveDarktableExposureRequest
} from "../../application/ports/live-darktable-session-gateway";
import {
  BunDarktableCliProcessRunner,
  type DarktableCliProcessRunner,
  type DarktableCliProcessResult
} from "./darktable-cli-process-runner";
import { DarktableLiveBridgeResponseParser } from "./darktable-live-bridge-response-parser";

export interface DarktableLiveBridgeRuntime {
  readonly binaryPath: string;
}

export class DarktableLiveBridge implements LiveDarktableSessionGateway {
  public constructor(
    private readonly runtime: DarktableLiveBridgeRuntime = DarktableLiveBridge.createDefaultRuntime(),
    private readonly processRunner: DarktableCliProcessRunner = new BunDarktableCliProcessRunner(),
    private readonly parser: DarktableLiveBridgeResponseParser = new DarktableLiveBridgeResponseParser(),
    private readonly nowMilliseconds: () => number = () => Date.now()
  ) {}

  public async getSession(): Promise<LiveDarktableSessionSnapshot> {
    const execution = await this.runBridgeCommand(["get-session"]);
    return this.parser.parseGetSession(execution.stdout, execution.diagnostics);
  }

  public async getSnapshot(): Promise<LiveDarktableSnapshotReadback> {
    const execution = await this.runBridgeCommand(["get-snapshot"]);
    return this.parser.parseGetSnapshot(execution.stdout, execution.diagnostics);
  }

  public async setExposure(
    request: SetLiveDarktableExposureRequest
  ): Promise<LiveDarktableExposureMutation> {
    const execution = await this.runBridgeCommand(["set-exposure", String(request.exposure)]);
    return this.parser.parseSetExposure(execution.stdout, execution.diagnostics);
  }

  public static createDefaultRuntime(
    env: NodeJS.ProcessEnv = process.env
  ): DarktableLiveBridgeRuntime {
    const configuredPath = env["DARKTABLE_LIVE_BRIDGE_PATH"];

    if (configuredPath !== undefined && configuredPath.length > 0) {
      return {
        binaryPath: path.resolve(configuredPath)
      };
    }

    return {
      binaryPath: path.resolve(import.meta.dir, "../../../../darktable/build/bin/darktable-live-bridge")
    };
  }

  private async runBridgeCommand(subcommandArguments: ReadonlyArray<string>): Promise<{
    readonly stdout: string;
    readonly diagnostics: LiveDarktableCommandDiagnostics;
  }> {
    const commandArguments = [this.runtime.binaryPath, ...subcommandArguments];
    const startedAt = this.nowMilliseconds();
    const result = await this.processRunner.run(commandArguments);
    const elapsedMilliseconds = this.nowMilliseconds() - startedAt;
    const diagnostics = this.buildDiagnostics(commandArguments, result, elapsedMilliseconds);

    if (result.exitCode !== 0) {
      throw new Error(this.describeProcessFailure(result, diagnostics));
    }

    return {
      stdout: result.stdout,
      diagnostics
    };
  }

  private buildDiagnostics(
    commandArguments: ReadonlyArray<string>,
    result: DarktableCliProcessResult,
    elapsedMilliseconds: number
  ): LiveDarktableCommandDiagnostics {
    return {
      helperBinaryPath: this.runtime.binaryPath,
      commandArguments: [...commandArguments],
      exitCode: result.exitCode,
      elapsedMilliseconds
    };
  }

  private describeProcessFailure(
    result: DarktableCliProcessResult,
    diagnostics: LiveDarktableCommandDiagnostics
  ): string {
    const output = `${result.stdout}\n${result.stderr}`.trim();

    if (output.length > 0) {
      return (
        `darktable-live-bridge failed (code=${String(result.exitCode)}; command=` +
        `${diagnostics.commandArguments.join(" ")}): ${output}`
      );
    }

    return (
      `darktable-live-bridge failed (code=${String(result.exitCode)}; command=` +
      `${diagnostics.commandArguments.join(" ")}): no diagnostic output.`
    );
  }
}
