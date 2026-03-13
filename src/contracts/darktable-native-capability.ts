import type { AdjustmentKind } from "./develop-recipe";

export type DarktableNativeCapabilityStatus = "supported" | "planned" | "fork-required";

export type PreviewCompilationStatus = "supported" | "unsupported";

export interface DarktableNativeCapability {
  readonly id: string;
  readonly module: string;
  readonly control: string;
  readonly status: DarktableNativeCapabilityStatus;
  readonly previewCompilationStatus: PreviewCompilationStatus;
  readonly recipeAdjustmentKinds: ReadonlyArray<AdjustmentKind>;
  readonly reason: string;
}

export type DarktableNativeCapabilityRegistry = Readonly<Record<string, DarktableNativeCapability>>;

export const DARKTABLE_NATIVE_CAPABILITY_REGISTRY: DarktableNativeCapabilityRegistry = {
  "crop.bounds": {
    id: "crop.bounds",
    module: "crop",
    control: "normalized bounds",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["crop"],
    reason: "Preview compilation writes normalized crop bounds directly into the darktable crop module."
  },
  "exposure.exposure": {
    id: "exposure.exposure",
    module: "exposure",
    control: "exposure compensation",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["exposure"],
    reason: "Preview compilation maps recipe exposure into the darktable exposure module."
  },
  "colorbalancergb.contrast": {
    id: "colorbalancergb.contrast",
    module: "colorbalancergb",
    control: "global contrast",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["contrast"],
    reason: "Preview compilation maps recipe contrast into darktable color balance rgb."
  },
  "colorbalancergb.saturation": {
    id: "colorbalancergb.saturation",
    module: "colorbalancergb",
    control: "global saturation",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["saturation"],
    reason: "Preview compilation maps recipe saturation into darktable color balance rgb."
  },
  "colorbalancergb.vibrance": {
    id: "colorbalancergb.vibrance",
    module: "colorbalancergb",
    control: "global vibrance",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["vibrance"],
    reason: "Preview compilation maps recipe vibrance into darktable color balance rgb."
  },
  "shadhi.highlights": {
    id: "shadhi.highlights",
    module: "shadhi",
    control: "highlight recovery",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["highlights"],
    reason: "Preview compilation maps recipe highlights into darktable shadows and highlights."
  },
  "shadhi.shadows": {
    id: "shadhi.shadows",
    module: "shadhi",
    control: "shadow lift",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["shadows"],
    reason: "Preview compilation maps recipe shadows into darktable shadows and highlights."
  },
  "rgblevels.blackPoint": {
    id: "rgblevels.blackPoint",
    module: "rgblevels",
    control: "linked black endpoint",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["blackPoint"],
    reason: "Preview compilation maps recipe blackPoint into the darktable rgb levels linked black endpoint."
  },
  "rgblevels.whitePoint": {
    id: "rgblevels.whitePoint",
    module: "rgblevels",
    control: "linked white endpoint",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["whitePoint"],
    reason: "Preview compilation maps recipe whitePoint into the darktable rgb levels linked white endpoint."
  },
  "temperature.whiteBalancePair": {
    id: "temperature.whiteBalancePair",
    module: "temperature",
    control: "temperature+tint pair",
    status: "supported",
    previewCompilationStatus: "supported",
    recipeAdjustmentKinds: ["temperature", "tint"],
    reason: "Preview compilation resolves truthful darktable white balance multipliers, but it only supports temperature and tint as a paired control."
  },
  "filmicrgb.whites": {
    id: "filmicrgb.whites",
    module: "filmicrgb",
    control: "white relative exposure",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: ["whites"],
    reason: "The recipe surface exposes whites, but darktable has no single truthful sidecar mapping that matches the current contract, so support remains planned."
  },
  "filmicrgb.blacks": {
    id: "filmicrgb.blacks",
    module: "filmicrgb",
    control: "black relative exposure",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: ["blacks"],
    reason: "The recipe surface exposes blacks, but darktable has no single truthful sidecar mapping that matches the current contract, so support remains planned."
  },
  "filmicrgb.latitude": {
    id: "filmicrgb.latitude",
    module: "filmicrgb",
    control: "contrast latitude",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "The darktable control exists, but the recipe contract does not yet model filmic-specific tone-mapping controls."
  },
  "toneequal.balance": {
    id: "toneequal.balance",
    module: "toneequal",
    control: "zone balance",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Tone equalizer is a darktable-native control family that needs its own explicit recipe model before truthful compilation can exist."
  },
  "colorzones.hueVsHue": {
    id: "colorzones.hueVsHue",
    module: "colorzones",
    control: "hue vs hue curve",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Color zones needs curve-shaped recipe data and cannot be represented by the current global adjustment surface."
  },
  "colorzones.hueVsSaturation": {
    id: "colorzones.hueVsSaturation",
    module: "colorzones",
    control: "hue vs saturation curve",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Color zones needs curve-shaped recipe data and cannot be represented by the current global adjustment surface."
  },
  "diffuse.captureSharpen": {
    id: "diffuse.captureSharpen",
    module: "diffuse",
    control: "capture sharpening preset",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Diffuse or sharpen support is intentionally out of scope until the recipe surface can express preset-like or iterative controls explicitly."
  },
  "denoiseprofile.profiledDenoise": {
    id: "denoiseprofile.profiledDenoise",
    module: "denoiseprofile",
    control: "profiled denoise strength",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Profiled denoise is darktable-native, but the recipe surface does not yet model noise-reduction intent or strength."
  },
  "lens.correction": {
    id: "lens.correction",
    module: "lens",
    control: "lens correction enablement",
    status: "planned",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Lens correction is a likely end-state capability, but the current contract has no lens-specific enablement or mode fields."
  },
  "retouch.spotRemoval": {
    id: "retouch.spotRemoval",
    module: "retouch",
    control: "spot removal strokes",
    status: "fork-required",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Retouch depends on complex stroke and shape data that the current sidecar-only compiler cannot author safely without deeper darktable integration."
  },
  "liquify.warp": {
    id: "liquify.warp",
    module: "liquify",
    control: "warp strokes",
    status: "fork-required",
    previewCompilationStatus: "unsupported",
    recipeAdjustmentKinds: [],
    reason: "Liquify requires geometric stroke data and edit-session semantics that are not realistic to support truthfully through the current compiler alone."
  }
};

export const listDarktableNativeCapabilities = (): DarktableNativeCapabilityRegistry =>
  DARKTABLE_NATIVE_CAPABILITY_REGISTRY;
