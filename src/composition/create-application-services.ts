import { StrictDevelopRecipeValidator } from "../contracts/develop-recipe";
import { CreatePreviewRender } from "../application/use-cases/create-preview-render";
import { RunDarktableSmokeTest } from "../application/use-cases/run-darktable-smoke-test";
import { RunDarktableSmokeCommand } from "../interfaces/cli/run-darktable-smoke-command";
import { RunAdjustmentCapabilitiesCommand } from "../interfaces/cli/run-adjustment-capabilities-command";
import { RunPreviewRenderCommand } from "../interfaces/cli/run-preview-render-command";
import { EnvironmentDarktableBinaryLocator } from "../infrastructure/darktable/environment-darktable-binary-locator";
import { DarktableCliRecipeCompiler } from "../infrastructure/darktable/darktable-cli-recipe-compiler";
import { DarktableCliPreviewRenderer } from "../infrastructure/darktable/darktable-cli-preview-renderer";
import { DarktableCliSmokePreviewRenderer } from "../infrastructure/darktable/darktable-cli-smoke-preview-renderer";
import { BunDarktableCliProcessRunner } from "../infrastructure/darktable/darktable-cli-process-runner";
import { DarktableWbResolveTemperatureModuleResolver } from "../infrastructure/darktable/darktable-wb-resolve-temperature-module-resolver";
import { LocalRunLayout } from "../infrastructure/runtime/local-run-layout";
import { FileManifestRepository } from "../infrastructure/manifests/file-manifest-repository";
import { ProjectFixtureCatalog } from "../infrastructure/fixtures/project-fixture-catalog";
import { SystemClock } from "../infrastructure/system/system-clock";
import { RandomIdGenerator } from "../infrastructure/system/random-id-generator";

interface ApplicationServiceContainer {
  readonly createPreviewRenderCommand: RunPreviewRenderCommand;
  readonly runDarktableSmokeCommand: RunDarktableSmokeCommand;
  readonly runAdjustmentCapabilitiesCommand: RunAdjustmentCapabilitiesCommand;
}

export const createApplicationServices = (): ApplicationServiceContainer => {
  const systemClock = new SystemClock();
  const randomIdGenerator = new RandomIdGenerator();
  const runLayout = new LocalRunLayout();
  const fixtureCatalog = new ProjectFixtureCatalog();
  const fileManifestRepository = new FileManifestRepository(runLayout);
  const binaryLocator = new EnvironmentDarktableBinaryLocator();
  const processRunner = new BunDarktableCliProcessRunner();
  const temperatureModuleResolver = new DarktableWbResolveTemperatureModuleResolver();
  const recipeCompiler = new DarktableCliRecipeCompiler(
    randomIdGenerator,
    runLayout,
    temperatureModuleResolver
  );
  const previewRenderer = new DarktableCliPreviewRenderer(
    systemClock,
    binaryLocator,
    runLayout,
    processRunner
  );
  const smokeRenderer = new DarktableCliSmokePreviewRenderer(
    systemClock,
    runLayout,
    binaryLocator,
    processRunner
  );
  const strictDevelopRecipeValidator = new StrictDevelopRecipeValidator();

  const createPreviewRender = new CreatePreviewRender(
    strictDevelopRecipeValidator,
    recipeCompiler,
    previewRenderer,
    fileManifestRepository,
    runLayout,
    systemClock,
    randomIdGenerator
  );

  const runDarktableSmokeTest = new RunDarktableSmokeTest(
    fixtureCatalog,
    smokeRenderer,
    systemClock,
    randomIdGenerator,
    fileManifestRepository
  );

  const createPreviewRenderCommand = new RunPreviewRenderCommand(
    createPreviewRender,
  );

  const runDarktableSmokeCommand = new RunDarktableSmokeCommand(
    runDarktableSmokeTest
  );

  const runAdjustmentCapabilitiesCommand = new RunAdjustmentCapabilitiesCommand();

  return {
    createPreviewRenderCommand,
    runDarktableSmokeCommand,
    runAdjustmentCapabilitiesCommand
  };
};
