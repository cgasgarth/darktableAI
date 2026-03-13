import { describe, expect, test } from "bun:test";

import {
  StrictDevelopRecipeValidator,
  type DevelopRecipe,
  type DevelopRecipeValidationIssue
} from "./develop-recipe";

describe("StrictDevelopRecipeValidator", () => {
  test("rejects recipes with empty adjustments", (): void => {
    const validator = new StrictDevelopRecipeValidator();
    const recipe: DevelopRecipe = {
      recipeId: "recipe-empty",
      sourceAssetPath: "../DSC00075.ARW",
      adjustments: []
    };

    const issues = validator.validate(recipe);

    expect(issues).toEqual<ReadonlyArray<DevelopRecipeValidationIssue>>([
      {
        code: "EMPTY_ADJUSTMENTS",
        message: "Develop recipes must contain at least one adjustment."
      }
    ]);
  });

  test("rejects duplicate adjustment kinds", (): void => {
    const validator = new StrictDevelopRecipeValidator();
    const recipe: DevelopRecipe = {
      recipeId: "recipe-duplicate",
      sourceAssetPath: "../DSC00075.ARW",
      adjustments: [
        {
          kind: "exposure",
          exposure: 0.5
        },
        {
          kind: "exposure",
          exposure: 1
        }
      ]
    };

    const issues = validator.validate(recipe);

    expect(issues).toEqual<ReadonlyArray<DevelopRecipeValidationIssue>>([
      {
        code: "DUPLICATE_ADJUSTMENT_KIND",
        message: "Develop recipe cannot repeat the 'exposure' adjustment kind."
      }
    ]);
  });

  test("rejects invalid crop bounds", (): void => {
    const validator = new StrictDevelopRecipeValidator();
    const recipe: DevelopRecipe = {
      recipeId: "recipe-invalid-crop",
      sourceAssetPath: "../DSC00075.ARW",
      adjustments: [
        {
          kind: "crop",
          left: 0.8,
          top: 0.8,
          width: 0.5,
          height: 0.3
        }
      ]
    };

    const issues = validator.validate(recipe);

    expect(issues).toEqual<ReadonlyArray<DevelopRecipeValidationIssue>>([
      {
        code: "INVALID_CROP_BOUNDS",
        message: "Crop adjustments must define normalized bounds within [0, 1] and within image dimensions."
      }
    ]);
  });

  test("rejects temperature or tint without its required pair", (): void => {
    const validator = new StrictDevelopRecipeValidator();
    const recipe: DevelopRecipe = {
      recipeId: "recipe-temperature-only",
      sourceAssetPath: "../DSC00075.ARW",
      adjustments: [
        {
          kind: "temperature",
          temperature: 5200
        }
      ]
    };

    const issues = validator.validate(recipe);

    expect(issues).toEqual<ReadonlyArray<DevelopRecipeValidationIssue>>([
      {
        code: "TEMPERATURE_TINT_PAIR_REQUIRED",
        message:
          "Develop recipes must provide temperature and tint together so darktableAI can resolve truthful darktable temperature module params."
      }
    ]);
  });

  test("rejects invalid rgb levels endpoints", (): void => {
    const validator = new StrictDevelopRecipeValidator();
    const recipe: DevelopRecipe = {
      recipeId: "recipe-invalid-rgblevels",
      sourceAssetPath: "../DSC00075.ARW",
      adjustments: [
        {
          kind: "blackPoint",
          blackPoint: 0.7
        },
        {
          kind: "whitePoint",
          whitePoint: 0.6
        }
      ]
    };

    const issues = validator.validate(recipe);

    expect(issues).toEqual<ReadonlyArray<DevelopRecipeValidationIssue>>([
      {
        code: "INVALID_RGBLEVELS_ENDPOINTS",
        message:
          "blackPoint and whitePoint must resolve to normalized rgb levels endpoints with blackPoint < whitePoint; omitted endpoints default to 0 and 1."
      }
    ]);
  });

  test("accepts a valid recipe", (): void => {
    const validator = new StrictDevelopRecipeValidator();
    const recipe: DevelopRecipe = {
      recipeId: "recipe-valid",
      sourceAssetPath: "../DSC00075.ARW",
      adjustments: [
        {
          kind: "crop",
          left: 0.1,
          top: 0.1,
          width: 0.8,
          height: 0.8
        },
        {
          kind: "temperature",
          temperature: 5200
        },
        {
          kind: "tint",
          tint: 1.05
        },
        {
          kind: "vibrance",
          vibrance: 15
        },
        {
          kind: "blackPoint",
          blackPoint: 0.05
        },
        {
          kind: "whitePoint",
          whitePoint: 0.95
        }
      ]
    };

    const issues = validator.validate(recipe);

    expect(issues).toEqual([]);
  });
});
