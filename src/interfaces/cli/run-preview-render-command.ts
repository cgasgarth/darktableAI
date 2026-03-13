import type { CliCommand, CliCommandResult } from "./cli-command";
import {
  type DevelopRecipe,
  type DevelopRecipeValidationIssue
} from "../../contracts/develop-recipe";
import {
  type PreviewRenderResponse,
  type PreviewRenderFailureResponse
} from "../api/http-contracts";
import {
  type CreatePreviewRenderRequest,
  type CreatePreviewRenderResult
} from "../../application/use-cases/create-preview-render";

interface CreatePreviewRenderPort {
  execute(request: CreatePreviewRenderRequest): Promise<CreatePreviewRenderResult>;
}


export interface RunPreviewRenderCommandInput {
  readonly recipe: DevelopRecipe;
  readonly requestId: string;
}

export class RunPreviewRenderCommand
  implements CliCommand<RunPreviewRenderCommandInput, PreviewRenderResponse>
{
  public constructor(private readonly createPreviewRender: CreatePreviewRenderPort) {}

  public async execute(
    input: RunPreviewRenderCommandInput
  ): Promise<CliCommandResult<PreviewRenderResponse>> {
    try {
      const request: CreatePreviewRenderRequest = {
        recipe: input.recipe
      };

      const response = await this.createPreviewRender.execute(request);

      if (response.status === "validation-failed") {
        const failureResponse: PreviewRenderFailureResponse = {
          requestId: input.requestId,
          status: "validation-failed",
          validationIssues: response.validationIssues
        };

        return {
          ok: false,
          error: this.formatValidationIssues(failureResponse.validationIssues)
        };
      }

      return {
        ok: true,
        output: {
          requestId: input.requestId,
          status: "ok",
          manifestId: response.manifest.manifestId,
          manifestPath: response.manifest.manifestPath,
          outputImagePath: response.manifest.outputImagePath,
          sourceAssetPath: response.manifest.sourceAssetPath,
          compiledArtifactPath: response.manifest.compiledArtifactPath,
          diagnostics: response.manifest.diagnostics
        }
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: this.formatFailure(error)
      };
    }
  }

  private formatValidationIssues(
    issues: ReadonlyArray<DevelopRecipeValidationIssue>
  ): string {
    if (issues.length === 0) {
      return "DevelopRecipe validation reported no issues.";
    }

    if (issues.length === 1) {
      const issue = issues[0];
      if (issue === undefined) {
        throw new Error("Validation issue list is malformed.");
      }

      return `${issue.code}: ${issue.message}`;
    }

    const details = issues
      .map((issue: DevelopRecipeValidationIssue): string => `${issue.code}: ${issue.message}`)
      .join("; ");

    return `DevelopRecipe failed validation: ${details}`;
  }

  private formatFailure(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error while running preview render.";
  }
}
