import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { JsonDevelopRecipeDocumentLoader } from "./develop-recipe-document-loader";

describe("JsonDevelopRecipeDocumentLoader", () => {
  test("loads a recipe file and resolves relative source paths", async () => {
    const workingDirectory = await mkdtemp(path.join(tmpdir(), "darktableai-loader-"));
    const recipeDirectory = path.join(workingDirectory, "recipes");
    const fixtureDirectory = path.join(workingDirectory, "fixtures");
    const recipeFilePath = path.join(recipeDirectory, "sample.json");
    const expectedSourceAssetPath = path.join(fixtureDirectory, "sample.ARW");

    await mkdir(recipeDirectory, { recursive: true });
    await mkdir(fixtureDirectory, { recursive: true });

    await Bun.write(expectedSourceAssetPath, "fixture");
    await Bun.write(
      recipeFilePath,
      JSON.stringify({
        recipeId: "recipe-1",
        sourceAssetPath: "../fixtures/sample.ARW",
        adjustments: [
          {
            kind: "exposure",
            exposure: 0.5
          }
        ]
      })
    );

    const loader = new JsonDevelopRecipeDocumentLoader();
    const recipe = await loader.loadFromFile(recipeFilePath);

    expect(recipe.recipeId).toBe("recipe-1");
    expect(recipe.sourceAssetPath).toBe(expectedSourceAssetPath);
    expect(recipe.adjustments).toHaveLength(1);
  });
});
