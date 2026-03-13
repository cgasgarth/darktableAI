import { access, constants } from "node:fs/promises";
import path from "node:path";

import type { Clock } from "../../application/ports/clock";
import type {
  DarktableRenderDiagnostics,
  PreviewRenderRequest,
  PreviewRenderResult
} from "../../application/models/render-artifacts";
import type { PreviewRenderer } from "../../application/ports/preview-renderer";
import { LocalRunLayout, type DarktableRuntimeState } from "../runtime/local-run-layout";
import {
  EnvironmentDarktableBinaryLocator,
  type DarktableBinaryLocatorResult
} from "./environment-darktable-binary-locator";
import {
  BunDarktableCliProcessRunner,
  type DarktableCliProcessRunner
} from "./darktable-cli-process-runner";

export class DarktableCliPreviewRenderer implements PreviewRenderer {
  public constructor(
    private readonly clock?: Clock,
    private readonly binaryLocator: EnvironmentDarktableBinaryLocator = new EnvironmentDarktableBinaryLocator(),
    private readonly runLayout: LocalRunLayout = new LocalRunLayout(),
    private readonly processRunner: DarktableCliProcessRunner = new BunDarktableCliProcessRunner()
  ) {}

  public async renderPreview(request: PreviewRenderRequest): Promise<PreviewRenderResult> {
    await this.assertReadableFile(request.sourceAssetPath, "Preview source asset");
    await this.assertReadableFile(request.compiledRecipe.xmpSidecarPath, "Preview XMP sidecar");
    await this.assertOutputDirectoryWritable(request.outputImagePath);

    const startedAt = this.now();
    const binary = await this.resolveDarktableCliBinary();
    const runtimeState = this.runLayout.createDarktableRuntimeState(
      `preview-${request.manifestId}-${request.renderId}`
    );
    const commandArguments = [
      binary,
      request.sourceAssetPath,
      request.compiledRecipe.xmpSidecarPath,
      request.outputImagePath,
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
      throw new Error(this.describeFailure(request, exitCode, stdout, stderr));
    }

    await this.assertReadableFile(request.outputImagePath, "Preview output image");

    return {
      manifestId: request.manifestId,
      renderId: request.renderId,
      outputImagePath: request.outputImagePath,
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

  private async assertReadableFile(filePath: string, label: string): Promise<void> {
    try {
      await access(filePath, constants.R_OK);
    } catch {
      throw new Error(`${label} is missing or not readable: ${filePath}`);
    }
  }

  private async assertOutputDirectoryWritable(outputImagePath: string): Promise<void> {
    const outputDirectory = path.dirname(outputImagePath);

    try {
      await access(outputDirectory, constants.W_OK);
    } catch {
      throw new Error(`Preview output directory is not writable: ${outputDirectory}`);
    }
  }

  private describeFailure(
    request: PreviewRenderRequest,
    exitCode: number,
    stdout: string,
    stderr: string
  ): string {
    const output = `${stdout}\n${stderr}`.trim();

    if (output.includes("Unable to find camera in database")) {
      return (
        `Preview render failed (code=${String(exitCode)}): Installed darktable cannot decode this RAW input yet: ` +
        request.sourceAssetPath
      );
    }

    if (output.length > 0) {
      return `Preview render failed (code=${String(exitCode)}): ${output}`;
    }

    return `Preview render failed (code=${String(exitCode)}): darktable-cli returned no diagnostic output.`;
  }
}
