import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { StrictDevelopRecipeValidator } from "../../contracts/develop-recipe";
import { CreatePreviewRender } from "../../application/use-cases/create-preview-render";
import { RunDarktableSmokeTest } from "../../application/use-cases/run-darktable-smoke-test";
import { JsonDevelopRecipeDocumentLoader } from "../../interfaces/cli/develop-recipe-document-loader";
import { DarktableCliPreviewRenderer } from "./darktable-cli-preview-renderer";
import { DarktableCliRecipeCompiler } from "./darktable-cli-recipe-compiler";
import { DarktableCliSmokePreviewRenderer } from "./darktable-cli-smoke-preview-renderer";
import { BunDarktableCliProcessRunner } from "./darktable-cli-process-runner";
import { EnvironmentDarktableBinaryLocator } from "./environment-darktable-binary-locator";
import { ProjectFixtureCatalog } from "../fixtures/project-fixture-catalog";
import { FileManifestRepository } from "../manifests/file-manifest-repository";
import { LocalRunLayout } from "../runtime/local-run-layout";
import { RandomIdGenerator } from "../system/random-id-generator";
import { SystemClock } from "../system/system-clock";

const REPOSITORY_ROOT = path.resolve(import.meta.dir, "../../..");
const EXAMPLE_RECIPES_DIRECTORY = path.resolve(REPOSITORY_ROOT, "examples", "recipes");

const PREVIEW_CASES = [
  {
    recipeFileName: "crop-recipe.json",
    expectedOperations: ["crop"]
  },
  {
    recipeFileName: "exposure-recipe.json",
    expectedOperations: ["exposure"]
  },
  {
    recipeFileName: "color-recipe.json",
    expectedOperations: ["colorbalancergb"]
  },
  {
    recipeFileName: "tone-recipe.json",
    expectedOperations: ["shadhi", "rgblevels"]
  },
  {
    recipeFileName: "sample-develop-recipe.json",
    expectedOperations: ["crop", "exposure", "shadhi", "rgblevels", "temperature", "colorbalancergb"]
  }
] as const;

describe("darktable fixture-backed regressions", (): void => {
  const temporaryDirectories: Array<string> = [];

  afterEach((): void => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test(
    "renders preview manifests and artifacts for each supported recipe area",
    async (): Promise<void> => {
    const loader = new JsonDevelopRecipeDocumentLoader();

    for (const previewCase of PREVIEW_CASES) {
      const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-preview-regression-"));
      temporaryDirectories.push(projectRoot);
      const runLayout = new LocalRunLayout(projectRoot);
      const manifestRepository = new FileManifestRepository(runLayout);
      const createPreviewRender = new CreatePreviewRender(
        new StrictDevelopRecipeValidator(),
        new DarktableCliRecipeCompiler(new RandomIdGenerator(), runLayout),
        new DarktableCliPreviewRenderer(
          new SystemClock(),
          new EnvironmentDarktableBinaryLocator(),
          runLayout,
          new BunDarktableCliProcessRunner()
        ),
        manifestRepository,
        runLayout,
        new SystemClock(),
        new RandomIdGenerator()
      );

      const recipeFilePath = path.resolve(EXAMPLE_RECIPES_DIRECTORY, previewCase.recipeFileName);
      const recipe = await loader.loadFromFile(recipeFilePath);
      const result = await createPreviewRender.execute({ recipe });

      expect(result.status).toBe("ok");

      if (result.status !== "ok") {
        throw new Error(`Expected preview render success for ${previewCase.recipeFileName}.`);
      }

      expect(result.compiledRecipe.modules.map((module) => module.operation)).toEqual(
        [...previewCase.expectedOperations]
      );

      assertFileExistsWithContent(result.manifest.manifestPath);
      assertFileExistsWithContent(result.compiledRecipe.compiledArtifactPath);
      assertFileExistsWithContent(result.previewResult.outputImagePath);

      const savedManifest = JSON.parse(readFileSync(result.manifest.manifestPath, "utf8")) as {
        kind: string;
        recipeId: string;
        compiledArtifactPath: string;
        outputImagePath: string;
        sourceAssetPath: string;
      };

      expect(savedManifest.kind).toBe("preview");
      expect(savedManifest.recipeId).toBe(recipe.recipeId);
      expect(savedManifest.compiledArtifactPath).toBe(result.compiledRecipe.compiledArtifactPath);
      expect(savedManifest.outputImagePath).toBe(result.previewResult.outputImagePath);
      expect(savedManifest.sourceAssetPath).toBe(recipe.sourceAssetPath);

      const xmpDocument = readFileSync(result.compiledRecipe.compiledArtifactPath, "utf8");
      for (const operation of previewCase.expectedOperations) {
        expect(xmpDocument).toContain(`darktable:operation="${operation}"`);
      }
    }
    },
    120000
  );

  test(
    "renders a smoke preview and persists its manifest for the supported raw fixture",
    async (): Promise<void> => {
      const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-smoke-regression-"));
      temporaryDirectories.push(projectRoot);
      const runLayout = new LocalRunLayout(projectRoot);
      const smokeTest = new RunDarktableSmokeTest(
        new ProjectFixtureCatalog(REPOSITORY_ROOT),
        new DarktableCliSmokePreviewRenderer(
          new SystemClock(),
          runLayout,
          new EnvironmentDarktableBinaryLocator(),
          new BunDarktableCliProcessRunner()
        ),
        new SystemClock(),
        new RandomIdGenerator(),
        new FileManifestRepository(runLayout)
      );

      const result = await smokeTest.execute({ fixtureId: "sample-fixture" });

      expect(result.status).toBe("ok");
      expect(result.fixture.sourceAssetPath).toBe(path.resolve(REPOSITORY_ROOT, "assets", "_DSC8809.ARW"));
      assertFileExistsWithContent(result.manifest.manifestPath);
      assertFileExistsWithContent(result.smokePreviewResult.outputImagePath);

      const savedManifest = JSON.parse(readFileSync(result.manifest.manifestPath, "utf8")) as {
        kind: string;
        fixtureId: string;
        outputImagePath: string;
        sourceAssetPath: string;
      };

      expect(savedManifest.kind).toBe("smoke");
      expect(savedManifest.fixtureId).toBe("sample-fixture");
      expect(savedManifest.outputImagePath).toBe(result.smokePreviewResult.outputImagePath);
      expect(savedManifest.sourceAssetPath).toBe(result.fixture.sourceAssetPath);
    },
    120000
  );
});

function assertFileExistsWithContent(filePath: string): void {
  expect(existsSync(filePath)).toBe(true);
  expect(statSync(filePath).size).toBeGreaterThan(0);
}
