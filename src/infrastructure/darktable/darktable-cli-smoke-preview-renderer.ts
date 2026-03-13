import { access, constants } from "node:fs/promises";
import path from "node:path";

import type { Clock } from "../../application/ports/clock";
import type {
  DarktableRenderDiagnostics,
  SmokePreviewRequest,
  SmokePreviewResult
} from "../../application/models/render-artifacts";
import type { SmokePreviewRenderer } from "../../application/ports/smoke-preview-renderer";
import { LocalRunLayout, type DarktableRuntimeState } from "../runtime/local-run-layout";
import {
  EnvironmentDarktableBinaryLocator,
  type DarktableBinaryLocatorResult
} from "./environment-darktable-binary-locator";
import {
  BunDarktableCliProcessRunner,
  type DarktableCliProcessRunner
} from "./darktable-cli-process-runner";

export class DarktableCliSmokePreviewRenderer implements SmokePreviewRenderer {
  public constructor(
    private readonly clock?: Clock,
    private readonly runLayout: LocalRunLayout = new LocalRunLayout(),
    private readonly binaryLocator: EnvironmentDarktableBinaryLocator = new EnvironmentDarktableBinaryLocator(),
    private readonly processRunner: DarktableCliProcessRunner = new BunDarktableCliProcessRunner()
  ) {}

  public async renderSmokePreview(request: SmokePreviewRequest): Promise<SmokePreviewResult> {
    await this.assertSourceAssetExists(request.sourceAssetPath);

    const startedAt = this.now();
    const outputImagePath = this.runLayout.getSmokeOutputPath(request.manifestId, request.smokeTestId);
    const runtimeState = this.runLayout.createDarktableRuntimeState(
      `smoke-${request.manifestId}-${request.smokeTestId}`
    );

    const binary = await this.resolveDarktableCliBinary();
    const commandArguments = [
      binary,
      request.sourceAssetPath,
      outputImagePath,
      "--core",
      "--configdir",
      runtimeState.configDirectory,
      "--cachedir",
      runtimeState.cacheDirectory,
      "--library",
      runtimeState.libraryPath,
      "--tmpdir",
      runtimeState.temporaryDirectory
    ];
    const { exitCode, stdout, stderr } = await this.processRunner.run(commandArguments);
    const completedAt = this.now();

    if (exitCode !== 0) {
      const trimmedOutput = `${stdout}\n${stderr}`.trim();
      const message = this.describeFailure(request.sourceAssetPath, trimmedOutput, exitCode);

      throw new Error(`Darktable smoke render failed (code=${String(exitCode)}): ${message}`);
    }

    await this.assertOutputImageExists(outputImagePath);

    return {
      manifestId: request.manifestId,
      smokeTestId: request.smokeTestId,
      outputImagePath,
      startedAt,
      completedAt,
      diagnostics: this.buildDiagnostics(binary, commandArguments, runtimeState, exitCode)
    };
  }

  private buildDiagnostics(
    binaryPath: string,
    commandArguments: ReadonlyArray<string>,
    runtimeState: DarktableRuntimeState,
    exitCode: number
  ): DarktableRenderDiagnostics {
    return {
      binaryPath,
      commandArguments: [...commandArguments],
      runtimeState: {
        rootDirectory: runtimeState.rootDirectory,
        configDirectory: runtimeState.configDirectory,
        cacheDirectory: runtimeState.cacheDirectory,
        temporaryDirectory: runtimeState.temporaryDirectory,
        libraryPath: runtimeState.libraryPath
      },
      exitCode
    };
  }

  private now(): Date {
    if (this.clock === undefined) {
      return new Date();
    }

    return this.clock.now();
  }

  private async resolveDarktableCliBinary(): Promise<string> {
    const located: DarktableBinaryLocatorResult = await this.binaryLocator.locate();

    if (located.status === "missing") {
      throw new Error(`Could not find required binary on PATH: ${located.missing.join(", ")}`);
    }

    return located.darktableCli.path;
  }

  private async assertSourceAssetExists(sourceAssetPath: string): Promise<void> {
    try {
      await access(sourceAssetPath, constants.R_OK);
    } catch {
      throw new Error(`Smoke fixture source missing or not readable: ${sourceAssetPath}`);
    }
  }

  private async assertOutputImageExists(outputImagePath: string): Promise<void> {
    try {
      await access(outputImagePath, constants.R_OK);
    } catch {
      const outputDirectory = path.dirname(outputImagePath);
      throw new Error(`Smoke render did not create output image at ${outputImagePath}. ${outputDirectory}`);
    }
  }

  private describeFailure(sourceAssetPath: string, output: string, exitCode: number): string {
    if (output.includes("Unable to find camera in database")) {
      return (
        `Installed darktable cannot decode this RAW fixture yet: ${sourceAssetPath}. ` +
        "Use a fixture supported by the installed RawSpeed database or run against a newer darktable build."
      );
    }

    if (output.length > 0) {
      return output;
    }

    return `darktable-cli returned non-zero exit code ${String(exitCode)}.`;
  }
}
