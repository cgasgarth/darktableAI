import type { CliCommand, CliCommandResult } from "./cli-command";
import {
  type SmokeTestResponse,
  type SmokeTestFailureResponse
} from "../api/http-contracts";
import {
  type RunDarktableSmokeTestResult,
  type RunDarktableSmokeTestRequest
} from "../../application/use-cases/run-darktable-smoke-test";

interface RunDarktableSmokeTestPort {
  execute(request: RunDarktableSmokeTestRequest): Promise<RunDarktableSmokeTestResult>;
}

export interface RunDarktableSmokeCommandInput {
  readonly requestId: string;
  readonly fixtureId: string;
}

export class RunDarktableSmokeCommand
  implements CliCommand<RunDarktableSmokeCommandInput, SmokeTestResponse>
{
  public constructor(private readonly runDarktableSmokeTest: RunDarktableSmokeTestPort) {}

  public async execute(
    input: RunDarktableSmokeCommandInput
  ): Promise<CliCommandResult<SmokeTestResponse>> {
    const request: RunDarktableSmokeTestRequest = {
      fixtureId: input.fixtureId
    };

    try {
      const response: RunDarktableSmokeTestResult =
        await this.runDarktableSmokeTest.execute(request);

      return {
        ok: true,
        output: {
          requestId: input.requestId,
          status: "ok",
          fixtureId: response.fixture.fixtureId,
          manifestId: response.manifest.manifestId,
          manifestPath: response.manifest.manifestPath,
          outputImagePath: response.smokePreviewResult.outputImagePath,
          sourceAssetPath: response.fixture.sourceAssetPath,
          diagnostics: response.manifest.diagnostics
        }
      };
    } catch (error: unknown) {
      const failure: SmokeTestFailureResponse = {
        requestId: input.requestId,
        status: "error",
        message: this.formatFailure(error)
      };

      return {
        ok: false,
        error: failure.message
      };
    }
  }

  private formatFailure(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error while running darktable smoke test.";
  }
}
