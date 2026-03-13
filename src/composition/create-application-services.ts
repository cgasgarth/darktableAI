import { StrictDevelopRecipeValidator } from "../contracts/develop-recipe";
import { ApplyLiveDarktableModuleInstanceAction } from "../application/use-cases/apply-live-darktable-module-instance-action";
import { CreatePreviewRender } from "../application/use-cases/create-preview-render";
import { GetLiveDarktableSnapshot } from "../application/use-cases/get-live-darktable-snapshot";
import { GetLiveDarktableSession } from "../application/use-cases/get-live-darktable-session";
import { RunDarktableSmokeTest } from "../application/use-cases/run-darktable-smoke-test";
import { SetLiveDarktableExposure } from "../application/use-cases/set-live-darktable-exposure";
import { SetLiveDarktableModuleBlend } from "../application/use-cases/set-live-darktable-module-blend";
import { RunDarktableSmokeCommand } from "../interfaces/cli/run-darktable-smoke-command";
import { RunAdjustmentCapabilitiesCommand } from "../interfaces/cli/run-adjustment-capabilities-command";
import { RunLiveModuleInstanceActionCommand } from "../interfaces/cli/run-live-module-instance-action-command";
import { RunLiveSetModuleBlendCommand } from "../interfaces/cli/run-live-set-module-blend-command";
import { RunLiveSessionInfoCommand } from "../interfaces/cli/run-live-session-info-command";
import { RunLiveSessionSnapshotCommand } from "../interfaces/cli/run-live-session-snapshot-command";
import { RunLiveSetExposureCommand } from "../interfaces/cli/run-live-set-exposure-command";
import { RunPreviewRenderCommand } from "../interfaces/cli/run-preview-render-command";
import { EnvironmentDarktableBinaryLocator } from "../infrastructure/darktable/environment-darktable-binary-locator";
import { DarktableCliRecipeCompiler } from "../infrastructure/darktable/darktable-cli-recipe-compiler";
import { DarktableCliPreviewRenderer } from "../infrastructure/darktable/darktable-cli-preview-renderer";
import { DarktableCliSmokePreviewRenderer } from "../infrastructure/darktable/darktable-cli-smoke-preview-renderer";
import { DarktableLiveBridge } from "../infrastructure/darktable/darktable-live-bridge";
import { BunDarktableCliProcessRunner } from "../infrastructure/darktable/darktable-cli-process-runner";
import { DarktableWbResolveTemperatureModuleResolver } from "../infrastructure/darktable/darktable-wb-resolve-temperature-module-resolver";
import { LocalRunLayout } from "../infrastructure/runtime/local-run-layout";
import { BunSleeper } from "../infrastructure/system/bun-sleeper";
import { FileManifestRepository } from "../infrastructure/manifests/file-manifest-repository";
import { ProjectFixtureCatalog } from "../infrastructure/fixtures/project-fixture-catalog";
import { SystemClock } from "../infrastructure/system/system-clock";
import { RandomIdGenerator } from "../infrastructure/system/random-id-generator";

interface ApplicationServiceContainer {
  readonly createPreviewRenderCommand: RunPreviewRenderCommand;
  readonly runDarktableSmokeCommand: RunDarktableSmokeCommand;
  readonly runAdjustmentCapabilitiesCommand: RunAdjustmentCapabilitiesCommand;
  readonly runLiveSessionInfoCommand: RunLiveSessionInfoCommand;
  readonly runLiveSessionSnapshotCommand: RunLiveSessionSnapshotCommand;
  readonly runLiveSetExposureCommand: RunLiveSetExposureCommand;
  readonly runLiveSetModuleBlendCommand: RunLiveSetModuleBlendCommand;
  readonly runLiveModuleInstanceActionCommand: RunLiveModuleInstanceActionCommand;
}

export const createApplicationServices = (): ApplicationServiceContainer => {
  const systemClock = new SystemClock();
  const randomIdGenerator = new RandomIdGenerator();
  const runLayout = new LocalRunLayout();
  const fixtureCatalog = new ProjectFixtureCatalog();
  const fileManifestRepository = new FileManifestRepository(runLayout);
  const binaryLocator = new EnvironmentDarktableBinaryLocator();
  const processRunner = new BunDarktableCliProcessRunner();
  const sleeper = new BunSleeper();
  const temperatureModuleResolver = new DarktableWbResolveTemperatureModuleResolver();
  const liveBridge = new DarktableLiveBridge();
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

  const getLiveDarktableSession = new GetLiveDarktableSession(liveBridge);
  const getLiveDarktableSnapshot = new GetLiveDarktableSnapshot(liveBridge);
  const applyLiveDarktableModuleInstanceAction = new ApplyLiveDarktableModuleInstanceAction(liveBridge);
  const setLiveDarktableExposure = new SetLiveDarktableExposure(
    liveBridge,
    systemClock,
    sleeper
  );
  const setLiveDarktableModuleBlend = new SetLiveDarktableModuleBlend(liveBridge);

  const createPreviewRenderCommand = new RunPreviewRenderCommand(
    createPreviewRender,
  );

  const runDarktableSmokeCommand = new RunDarktableSmokeCommand(
    runDarktableSmokeTest
  );

  const runAdjustmentCapabilitiesCommand = new RunAdjustmentCapabilitiesCommand();
  const runLiveSessionInfoCommand = new RunLiveSessionInfoCommand(getLiveDarktableSession);
  const runLiveSessionSnapshotCommand = new RunLiveSessionSnapshotCommand(getLiveDarktableSnapshot);
  const runLiveSetExposureCommand = new RunLiveSetExposureCommand(setLiveDarktableExposure);
  const runLiveSetModuleBlendCommand = new RunLiveSetModuleBlendCommand(setLiveDarktableModuleBlend);
  const runLiveModuleInstanceActionCommand = new RunLiveModuleInstanceActionCommand(
    applyLiveDarktableModuleInstanceAction
  );

  return {
    createPreviewRenderCommand,
    runDarktableSmokeCommand,
    runAdjustmentCapabilitiesCommand,
    runLiveSessionInfoCommand,
    runLiveSessionSnapshotCommand,
    runLiveSetExposureCommand,
    runLiveSetModuleBlendCommand,
    runLiveModuleInstanceActionCommand
  };
};
