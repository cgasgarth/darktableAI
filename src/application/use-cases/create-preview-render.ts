import type { DevelopRecipe, DevelopRecipeValidationIssue } from "../../contracts/develop-recipe";

import type { Clock } from "../ports/clock";
import type { DevelopRecipeCompiler } from "../ports/develop-recipe-compiler";
import type { IdGenerator } from "../ports/id-generator";
import type { ManifestRepository } from "../ports/manifest-repository";
import type { PreviewArtifactLayout } from "../ports/preview-artifact-layout";
import type { PreviewRenderer } from "../ports/preview-renderer";
import type { DevelopRecipeValidator } from "../ports/develop-recipe-validator";
import type {
  CompiledDevelopRecipe,
  ManifestSaveRequest,
  PreviewRenderManifest,
  PreviewRenderRequest,
  PreviewRenderResult
} from "../models/render-artifacts";

export interface CreatePreviewRenderRequest {
  readonly recipe: DevelopRecipe;
}

export type CreatePreviewRenderResult = CreatePreviewRenderFailure | CreatePreviewRenderSuccess;

export interface CreatePreviewRenderFailure {
  readonly status: "validation-failed";
  readonly validationIssues: ReadonlyArray<DevelopRecipeValidationIssue>;
}

export interface CreatePreviewRenderSuccess {
  readonly status: "ok";
  readonly manifest: PreviewRenderManifest;
  readonly compiledRecipe: CompiledDevelopRecipe;
  readonly previewResult: PreviewRenderResult;
}

export class CreatePreviewRender {
  public constructor(
    private readonly validator: DevelopRecipeValidator,
    private readonly compiler: DevelopRecipeCompiler,
    private readonly previewRenderer: PreviewRenderer,
    private readonly manifestRepository: ManifestRepository,
    private readonly previewArtifactLayout: PreviewArtifactLayout,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator
  ) {}

  public async execute(request: CreatePreviewRenderRequest): Promise<CreatePreviewRenderResult> {
    const validationIssues = this.validator.validate(request.recipe);

    if (validationIssues.length > 0) {
      return {
        status: "validation-failed",
        validationIssues
      };
    }

    const compiledRecipe = await this.compiler.compile(request.recipe);
    const requestedAt = this.clock.now();
    const manifestId = this.idGenerator.generate();
    const renderId = this.idGenerator.generate();

    const renderRequest: PreviewRenderRequest = this.buildPreviewRenderRequest(
      request,
      compiledRecipe,
      manifestId,
      renderId,
      requestedAt
    );

    const previewResult = await this.previewRenderer.renderPreview(renderRequest);

    const manifest = this.buildPreviewManifest(
      request,
      compiledRecipe,
      previewResult,
      renderId,
      manifestId,
      requestedAt
    );

    const saveRequest: ManifestSaveRequest<PreviewRenderManifest> = {
      manifest
    };

    const savedManifest = await this.manifestRepository.saveManifest(saveRequest);

    return {
      status: "ok",
      manifest: savedManifest,
      compiledRecipe,
      previewResult
    };
  }

  private buildPreviewRenderRequest(
    request: CreatePreviewRenderRequest,
    compiledRecipe: CompiledDevelopRecipe,
    manifestId: string,
    renderId: string,
    requestedAt: Date
  ): PreviewRenderRequest {
    return {
      manifestId,
      renderId,
      recipeId: request.recipe.recipeId,
      sourceAssetPath: request.recipe.sourceAssetPath,
      compiledRecipe,
      outputImagePath: this.previewArtifactLayout.getPreviewOutputPath(manifestId),
      requestedAt
    };
  }

  private buildPreviewManifest(
    request: CreatePreviewRenderRequest,
    compiledRecipe: CompiledDevelopRecipe,
    previewResult: PreviewRenderResult,
    renderId: string,
    manifestId: string,
    requestedAt: Date
  ): PreviewRenderManifest {
    return {
      kind: "preview",
      manifestId,
      manifestPath: this.manifestRepository.getManifestPath(manifestId),
      createdAt: requestedAt,
      sourceAssetPath: request.recipe.sourceAssetPath,
      outputImagePath: previewResult.outputImagePath,
      requestedAt,
      diagnostics: previewResult.diagnostics,
      recipeId: request.recipe.recipeId,
      renderId,
      compileId: compiledRecipe.compileId,
      compiledArtifactPath: compiledRecipe.compiledArtifactPath,
      previewStartedAt: previewResult.startedAt,
      previewCompletedAt: previewResult.completedAt
    };
  }
}
