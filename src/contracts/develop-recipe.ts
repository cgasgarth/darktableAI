export interface DevelopRecipe {
  readonly recipeId: string;
  readonly sourceAssetPath: string;
  readonly adjustments: ReadonlyArray<AdjustmentOperation>;
}

export type AdjustmentKind =
  | "crop"
  | "exposure"
  | "contrast"
  | "highlights"
  | "shadows"
  | "whitePoint"
  | "blackPoint"
  | "whites"
  | "blacks"
  | "temperature"
  | "tint"
  | "saturation"
  | "vibrance";

export type AdjustmentOperation =
  | CropAdjustment
  | ExposureAdjustment
  | ContrastAdjustment
  | HighlightsAdjustment
  | ShadowsAdjustment
  | WhitePointAdjustment
  | BlackPointAdjustment
  | WhitesAdjustment
  | BlacksAdjustment
  | TemperatureAdjustment
  | TintAdjustment
  | SaturationAdjustment
  | VibranceAdjustment;

export interface CropAdjustment {
  readonly kind: "crop";
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface ExposureAdjustment {
  readonly kind: "exposure";
  readonly exposure: number;
}

export interface ContrastAdjustment {
  readonly kind: "contrast";
  readonly contrast: number;
}

export interface HighlightsAdjustment {
  readonly kind: "highlights";
  readonly highlights: number;
}

export interface ShadowsAdjustment {
  readonly kind: "shadows";
  readonly shadows: number;
}

export interface WhitePointAdjustment {
  readonly kind: "whitePoint";
  readonly whitePoint: number;
}

export interface BlackPointAdjustment {
  readonly kind: "blackPoint";
  readonly blackPoint: number;
}

export interface WhitesAdjustment {
  readonly kind: "whites";
  readonly whites: number;
}

export interface BlacksAdjustment {
  readonly kind: "blacks";
  readonly blacks: number;
}

export interface TemperatureAdjustment {
  readonly kind: "temperature";
  readonly temperature: number;
}

export interface TintAdjustment {
  readonly kind: "tint";
  readonly tint: number;
}

export interface SaturationAdjustment {
  readonly kind: "saturation";
  readonly saturation: number;
}

export interface VibranceAdjustment {
  readonly kind: "vibrance";
  readonly vibrance: number;
}

export interface DevelopRecipeValidationIssue {
  readonly code:
    | "EMPTY_SOURCE_ASSET_PATH"
    | "EMPTY_ADJUSTMENTS"
    | "DUPLICATE_ADJUSTMENT_KIND"
    | "INVALID_CROP_BOUNDS"
    | "INVALID_RGBLEVELS_ENDPOINTS"
    | "TEMPERATURE_TINT_PAIR_REQUIRED";
  readonly message: string;
}

export interface DevelopRecipeValidator {
  validate(recipe: DevelopRecipe): ReadonlyArray<DevelopRecipeValidationIssue>;
}

export class StrictDevelopRecipeValidator implements DevelopRecipeValidator {
  public validate(recipe: DevelopRecipe): ReadonlyArray<DevelopRecipeValidationIssue> {
    const issues: Array<DevelopRecipeValidationIssue> = [];

    if (recipe.sourceAssetPath.trim().length === 0) {
      issues.push({
        code: "EMPTY_SOURCE_ASSET_PATH",
        message: "Develop recipes require a non-empty source asset path."
      });
    }

    if (recipe.adjustments.length === 0) {
      issues.push({
        code: "EMPTY_ADJUSTMENTS",
        message: "Develop recipes must contain at least one adjustment."
      });
    }

    const seenKinds = new Set<AdjustmentKind>();
    let hasTemperature = false;
    let hasTint = false;
    let blackPoint = 0;
    let whitePoint = 1;

    for (const adjustment of recipe.adjustments) {
      if (seenKinds.has(adjustment.kind)) {
        issues.push({
          code: "DUPLICATE_ADJUSTMENT_KIND",
          message: `Develop recipe cannot repeat the '${adjustment.kind}' adjustment kind.`
        });
      }

      seenKinds.add(adjustment.kind);

      if (adjustment.kind === "crop") {
        if (!this.isNormalizedCrop(adjustment)) {
          issues.push({
            code: "INVALID_CROP_BOUNDS",
            message: "Crop adjustments must define normalized bounds within [0, 1] and within image dimensions."
          });
        }
      }

      if (adjustment.kind === "temperature") {
        hasTemperature = true;
      }

      if (adjustment.kind === "tint") {
        hasTint = true;
      }

      if (adjustment.kind === "blackPoint") {
        blackPoint = adjustment.blackPoint;
      }

      if (adjustment.kind === "whitePoint") {
        whitePoint = adjustment.whitePoint;
      }
    }

    if (!this.isNormalizedValue(blackPoint) || !this.isNormalizedValue(whitePoint) || blackPoint >= whitePoint) {
      issues.push({
        code: "INVALID_RGBLEVELS_ENDPOINTS",
        message:
          "blackPoint and whitePoint must resolve to normalized rgb levels endpoints with blackPoint < whitePoint; omitted endpoints default to 0 and 1."
      });
    }

    if (hasTemperature !== hasTint) {
      issues.push({
        code: "TEMPERATURE_TINT_PAIR_REQUIRED",
        message:
          "Develop recipes must provide temperature and tint together so darktableAI can resolve truthful darktable temperature module params."
      });
    }

    return issues;
  }

  private isNormalizedCrop(crop: CropAdjustment): boolean {
    if (!this.isNormalizedValue(crop.left) || !this.isNormalizedValue(crop.top) || !this.isNormalizedValue(crop.width) || !this.isNormalizedValue(crop.height)) {
      return false;
    }

    if (crop.width === 0 || crop.height === 0) {
      return false;
    }

    if (crop.left + crop.width > 1) {
      return false;
    }

    if (crop.top + crop.height > 1) {
      return false;
    }

    return true;
  }

  private isNormalizedValue(value: number): boolean {
    return value >= 0 && value <= 1;
  }
}
