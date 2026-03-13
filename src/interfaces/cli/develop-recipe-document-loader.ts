import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  AdjustmentOperation,
  BlackPointAdjustment,
  BlacksAdjustment,
  ContrastAdjustment,
  CropAdjustment,
  DevelopRecipe,
  ExposureAdjustment,
  HighlightsAdjustment,
  SaturationAdjustment,
  ShadowsAdjustment,
  TemperatureAdjustment,
  TintAdjustment,
  VibranceAdjustment,
  WhitePointAdjustment,
  WhitesAdjustment
} from "../../contracts/develop-recipe";

export interface DevelopRecipeDocumentLoader {
  loadFromFile(recipeFilePath: string): Promise<DevelopRecipe>;
}

type JsonObject = Readonly<Record<string, unknown>>;

export class JsonDevelopRecipeDocumentLoader implements DevelopRecipeDocumentLoader {
  public async loadFromFile(recipeFilePath: string): Promise<DevelopRecipe> {
    const fileContents = await readFile(recipeFilePath, "utf8");
    const parsed = this.parseJson(fileContents, recipeFilePath);
    const recipeDocument = this.assertObject(parsed, "Recipe file root must be a JSON object.");
    const sourceDirectory = path.dirname(recipeFilePath);

    return {
      recipeId: this.readString(recipeDocument, "recipeId"),
      sourceAssetPath: this.resolveSourceAssetPath(
        sourceDirectory,
        this.readString(recipeDocument, "sourceAssetPath")
      ),
      adjustments: this.readAdjustments(recipeDocument)
    };
  }

  private parseJson(fileContents: string, recipeFilePath: string): unknown {
    try {
      return JSON.parse(fileContents) as unknown;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown JSON parse error.";
      throw new Error(`Recipe file '${recipeFilePath}' is not valid JSON: ${message}`);
    }
  }

  private assertObject(value: unknown, message: string): JsonObject {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(message);
    }

    return value as JsonObject;
  }

  private readString(document: JsonObject, key: string): string {
    const value = document[key];

    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`Recipe field '${key}' must be a non-empty string.`);
    }

    return value;
  }

  private readNumber(document: JsonObject, key: string): number {
    const value = document[key];

    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error(`Recipe field '${key}' must be a finite number.`);
    }

    return value;
  }

  private readAdjustments(document: JsonObject): ReadonlyArray<AdjustmentOperation> {
    const adjustmentsValue = document["adjustments"];

    if (!Array.isArray(adjustmentsValue)) {
      throw new Error("Recipe field 'adjustments' must be an array.");
    }

    return adjustmentsValue.map((value: unknown, index: number): AdjustmentOperation => {
      const adjustment = this.assertObject(value, `Adjustment at index ${String(index)} must be an object.`);
      const kind = this.readString(adjustment, "kind");

      switch (kind) {
        case "crop":
          return this.readCropAdjustment(adjustment);
        case "exposure":
          return this.readExposureAdjustment(adjustment);
        case "contrast":
          return this.readContrastAdjustment(adjustment);
        case "highlights":
          return this.readHighlightsAdjustment(adjustment);
        case "shadows":
          return this.readShadowsAdjustment(adjustment);
        case "whitePoint":
          return this.readWhitePointAdjustment(adjustment);
        case "blackPoint":
          return this.readBlackPointAdjustment(adjustment);
        case "whites":
          return this.readWhitesAdjustment(adjustment);
        case "blacks":
          return this.readBlacksAdjustment(adjustment);
        case "temperature":
          return this.readTemperatureAdjustment(adjustment);
        case "tint":
          return this.readTintAdjustment(adjustment);
        case "saturation":
          return this.readSaturationAdjustment(adjustment);
        case "vibrance":
          return this.readVibranceAdjustment(adjustment);
        default:
          throw new Error(`Unsupported adjustment kind '${kind}' in recipe file.`);
      }
    });
  }

  private readCropAdjustment(document: JsonObject): CropAdjustment {
    return {
      kind: "crop",
      left: this.readNumber(document, "left"),
      top: this.readNumber(document, "top"),
      width: this.readNumber(document, "width"),
      height: this.readNumber(document, "height")
    };
  }

  private readExposureAdjustment(document: JsonObject): ExposureAdjustment {
    return {
      kind: "exposure",
      exposure: this.readNumber(document, "exposure")
    };
  }

  private readContrastAdjustment(document: JsonObject): ContrastAdjustment {
    return {
      kind: "contrast",
      contrast: this.readNumber(document, "contrast")
    };
  }

  private readHighlightsAdjustment(document: JsonObject): HighlightsAdjustment {
    return {
      kind: "highlights",
      highlights: this.readNumber(document, "highlights")
    };
  }

  private readShadowsAdjustment(document: JsonObject): ShadowsAdjustment {
    return {
      kind: "shadows",
      shadows: this.readNumber(document, "shadows")
    };
  }

  private readWhitePointAdjustment(document: JsonObject): WhitePointAdjustment {
    return {
      kind: "whitePoint",
      whitePoint: this.readNumber(document, "whitePoint")
    };
  }

  private readBlackPointAdjustment(document: JsonObject): BlackPointAdjustment {
    return {
      kind: "blackPoint",
      blackPoint: this.readNumber(document, "blackPoint")
    };
  }

  private readWhitesAdjustment(document: JsonObject): WhitesAdjustment {
    return {
      kind: "whites",
      whites: this.readNumber(document, "whites")
    };
  }

  private readBlacksAdjustment(document: JsonObject): BlacksAdjustment {
    return {
      kind: "blacks",
      blacks: this.readNumber(document, "blacks")
    };
  }

  private readTemperatureAdjustment(document: JsonObject): TemperatureAdjustment {
    return {
      kind: "temperature",
      temperature: this.readNumber(document, "temperature")
    };
  }

  private readTintAdjustment(document: JsonObject): TintAdjustment {
    return {
      kind: "tint",
      tint: this.readNumber(document, "tint")
    };
  }

  private readSaturationAdjustment(document: JsonObject): SaturationAdjustment {
    return {
      kind: "saturation",
      saturation: this.readNumber(document, "saturation")
    };
  }

  private readVibranceAdjustment(document: JsonObject): VibranceAdjustment {
    return {
      kind: "vibrance",
      vibrance: this.readNumber(document, "vibrance")
    };
  }

  private resolveSourceAssetPath(sourceDirectory: string, sourceAssetPath: string): string {
    if (path.isAbsolute(sourceAssetPath)) {
      return sourceAssetPath;
    }

    return path.resolve(sourceDirectory, sourceAssetPath);
  }
}
