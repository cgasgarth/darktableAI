import type { AdjustmentKind } from "./develop-recipe";
import {
  AUDITED_DARKTABLE_IOP_MODULES,
  type AuditedDarktableIopModule
} from "./darktable-iop-audited-inventory";

export type DarktableCatalogModule = AuditedDarktableIopModule | "lens";
export type DarktableModuleCatalogCategory =
  | "color"
  | "effects"
  | "geometry"
  | "raw"
  | "repair"
  | "technical"
  | "tone";
export type DarktableModuleCatalogStatus =
  | "implemented"
  | "partial"
  | "planned"
  | "fork-required"
  | "legacy"
  | "excluded";
export type DarktableModuleSupportState = "supported" | "unsupported";
export type DarktableModuleParameterBacklogStatus =
  | "complete"
  | "partial"
  | "queued"
  | "blocked"
  | "not-applicable";

export interface DarktableModuleCapabilityCatalogEntry {
  readonly module: DarktableCatalogModule;
  readonly sourcePath: string;
  readonly category: DarktableModuleCatalogCategory;
  readonly status: DarktableModuleCatalogStatus;
  readonly recipeMappings: ReadonlyArray<AdjustmentKind>;
  readonly nativeCapabilityIds: ReadonlyArray<string>;
  readonly previewSupport: DarktableModuleSupportState;
  readonly liveSupport: DarktableModuleSupportState;
  readonly parameterBacklogStatus: DarktableModuleParameterBacklogStatus;
  readonly rationale: string;
}

export type DarktableModuleCapabilityCatalog = Readonly<
  Record<DarktableCatalogModule, DarktableModuleCapabilityCatalogEntry>
>;

type EntryOptions = Omit<DarktableModuleCapabilityCatalogEntry, "module" | "sourcePath">;

const sourcePathOf = (module: DarktableCatalogModule): string =>
  module === "lens" ? "darktable/src/iop/lens.cc" : `darktable/src/iop/${module}.c`;

const entry = (
  module: DarktableCatalogModule,
  options: EntryOptions
): DarktableModuleCapabilityCatalogEntry => ({
  module,
  sourcePath: sourcePathOf(module),
  ...options
});

const planned = (
  module: DarktableCatalogModule,
  category: DarktableModuleCatalogCategory,
  rationale: string,
  recipeMappings: ReadonlyArray<AdjustmentKind> = [],
  nativeCapabilityIds: ReadonlyArray<string> = []
): DarktableModuleCapabilityCatalogEntry =>
  entry(module, {
    category,
    status: "planned",
    recipeMappings,
    nativeCapabilityIds,
    previewSupport: "unsupported",
    liveSupport: "unsupported",
    parameterBacklogStatus: "queued",
    rationale
  });

const excluded = (
  module: DarktableCatalogModule,
  category: DarktableModuleCatalogCategory,
  rationale: string
): DarktableModuleCapabilityCatalogEntry =>
  entry(module, {
    category,
    status: "excluded",
    recipeMappings: [],
    nativeCapabilityIds: [],
    previewSupport: "unsupported",
    liveSupport: "unsupported",
    parameterBacklogStatus: "not-applicable",
    rationale
  });

const legacy = (
  module: DarktableCatalogModule,
  category: DarktableModuleCatalogCategory,
  rationale: string
): DarktableModuleCapabilityCatalogEntry =>
  entry(module, {
    category,
    status: "legacy",
    recipeMappings: [],
    nativeCapabilityIds: [],
    previewSupport: "unsupported",
    liveSupport: "unsupported",
    parameterBacklogStatus: "not-applicable",
    rationale
  });

export const DARKTABLE_MODULE_CAPABILITY_CATALOG: DarktableModuleCapabilityCatalog = {
  agx: planned("agx", "tone", "AgX is a modern tone-mapping module, but darktableAI has no AgX recipe model yet."),
  ashift: planned("ashift", "geometry", "Rotate and perspective is user-editable, but darktableAI does not yet model guided perspective parameters."),
  ashift_lsd: excluded("ashift_lsd", "technical", "Bundled line-segment-detector helper code for ashift; it is not a standalone editable module."),
  ashift_nmsimplex: excluded("ashift_nmsimplex", "technical", "Bundled optimization helper code for ashift; it is not a standalone editable module."),
  atrous: planned("atrous", "tone", "Contrast equalizer needs frequency-band controls that the current contracts do not express."),
  basecurve: planned("basecurve", "tone", "Base curve remains user-editable in darktable, but darktableAI has no truthful curve contract for it."),
  basicadj: legacy("basicadj", "tone", "darktable flags basic adjustments deprecated in favor of the quick access panel, so keep it only for audit completeness."),
  bilat: planned("bilat", "tone", "Local contrast exists, but darktableAI has no bounded local-contrast parameter surface yet."),
  bloom: planned("bloom", "effects", "Bloom is user-editable, but darktableAI does not model glow radius and threshold parameters yet."),
  blurs: planned("blurs", "effects", "Blurs needs effect-specific geometry and kernel controls that are not modeled yet."),
  borders: planned("borders", "geometry", "Framing is user-editable, but darktableAI has no canvas and border-layout contract yet."),
  cacorrect: planned("cacorrect", "raw", "Raw chromatic aberrations is user-editable, but darktableAI has no raw aberration correction contract yet."),
  cacorrectrgb: planned("cacorrectrgb", "raw", "Chromatic aberrations is user-editable, but darktableAI does not yet model its correction parameters."),
  censorize: planned("censorize", "repair", "Censorize needs region geometry and masking controls that the current recipe surface cannot encode."),
  channelmixer: legacy("channelmixer", "color", "darktable flags channel mixer deprecated in favor of color calibration, so keep it cataloged as legacy only."),
  channelmixerrgb: planned("channelmixerrgb", "color", "Color calibration needs illuminant, channel-mixer, and adaptation controls beyond the current recipe model."),
  clahe: legacy("clahe", "tone", "darktable flags old local contrast deprecated, so it is cataloged as a legacy surface rather than a parity target."),
  clipping: legacy("clipping", "geometry", "darktable flags crop and rotate deprecated in favor of newer geometry modules, so keep it only as legacy inventory."),
  colisa: legacy("colisa", "tone", "darktable flags contrast brightness saturation deprecated in favor of color balance rgb, so keep it cataloged as legacy."),
  colorbalance: planned("colorbalance", "color", "Legacy color balance is still editable, but darktableAI is standardizing on color balance rgb before older color wheels."),
  colorbalancergb: entry("colorbalancergb", { category: "color", status: "partial", recipeMappings: ["contrast", "saturation", "vibrance"], nativeCapabilityIds: ["colorbalancergb.contrast", "colorbalancergb.saturation", "colorbalancergb.vibrance"], previewSupport: "supported", liveSupport: "unsupported", parameterBacklogStatus: "partial", rationale: "Preview compilation supports contrast, saturation, and vibrance through color balance rgb, but the broader module parameter family remains backlogged." }),
  colorchecker: planned("colorchecker", "color", "Color look up table editing needs swatch-grid and interpolation data that the current contracts do not express."),
  colorcontrast: planned("colorcontrast", "color", "Color contrast needs opponent-color parameters and masks that are not modeled yet."),
  colorcorrection: planned("colorcorrection", "color", "Color correction is user-editable, but darktableAI has no truthful per-channel color-wheel contract for it yet."),
  colorequal: planned("colorequal", "color", "Color equalizer needs hue-range spline data and masking semantics beyond the current recipe model."),
  colorin: excluded("colorin", "technical", "Input color profile is a mandatory pipeline/profile stage rather than a normal user-authored editing capability target."),
  colorize: planned("colorize", "color", "Colorize needs hue and blending controls that darktableAI has not exposed yet."),
  colormapping: planned("colormapping", "color", "Color mapping depends on sampled source and target palettes, not the current bounded recipe primitives."),
  colorout: excluded("colorout", "technical", "Output color profile is a mandatory display/export profile stage, not a darktableAI editing parity target."),
  colorreconstruction: planned("colorreconstruction", "raw", "Color reconstruction is user-editable, but darktableAI has no highlight-color recovery contract yet."),
  colortransfer: legacy("colortransfer", "color", "darktable flags color transfer deprecated in favor of color mapping, so keep it cataloged as legacy only."),
  colorzones: planned("colorzones", "color", "Color zones needs curve-shaped hue/value controls before truthful support is possible.", [], ["colorzones.hueVsHue", "colorzones.hueVsSaturation"]),
  crop: entry("crop", { category: "geometry", status: "partial", recipeMappings: ["crop"], nativeCapabilityIds: ["crop.bounds"], previewSupport: "supported", liveSupport: "unsupported", parameterBacklogStatus: "complete", rationale: "darktableAI already compiles normalized crop bounds truthfully into the crop module, but live crop mutation and readback still need parity work." }),
  defringe: legacy("defringe", "color", "darktable flags defringe deprecated in favor of chromatic aberration correction, so it stays cataloged as legacy."),
  demosaic: planned("demosaic", "raw", "Demosaic is user-editable for raw files, but darktableAI has no raw-method selection contract yet."),
  denoiseprofile: planned("denoiseprofile", "raw", "Profiled denoise is a planned darktable-native control family with no truthful recipe surface yet.", [], ["denoiseprofile.profiledDenoise"]),
  diffuse: planned("diffuse", "repair", "Diffuse or sharpen needs preset-like iteration stacks that the current recipe model cannot express.", [], ["diffuse.captureSharpen"]),
  dither: planned("dither", "effects", "Dither or posterize needs mode-specific controls that darktableAI has not modeled yet."),
  enlargecanvas: planned("enlargecanvas", "geometry", "Enlarge canvas needs explicit anchor and fill semantics beyond the current crop-only geometry contract."),
  equalizer: legacy("equalizer", "tone", "darktable flags legacy equalizer deprecated in favor of contrast equalizer, so it remains cataloged only for completeness."),
  exposure: entry("exposure", { category: "tone", status: "partial", recipeMappings: ["exposure"], nativeCapabilityIds: ["exposure.exposure"], previewSupport: "supported", liveSupport: "supported", parameterBacklogStatus: "partial", rationale: "darktableAI supports preview and live exposure compensation, but the rest of exposure-module parameter coverage remains backlogged." }),
  filmic: legacy("filmic", "tone", "darktable flags filmic deprecated in favor of filmic rgb, so keep it cataloged as legacy instead of a modern parity target."),
  filmicrgb: planned("filmicrgb", "tone", "Filmic rgb is a priority tone module, but darktableAI still lacks a truthful filmic parameter contract.", ["whites", "blacks"], ["filmicrgb.whites", "filmicrgb.blacks", "filmicrgb.latitude"]),
  finalscale: excluded("finalscale", "technical", "Hidden no-history final-size scaler used by the pipeline; it is not a user-editable capability surface."),
  flip: planned("flip", "geometry", "Orientation is user-editable, but darktableAI has not yet modeled discrete flip and rotation operations."),
  gamma: excluded("gamma", "technical", "Hidden internal gamma/fence stage; darktable marks it non-user-facing, so it is excluded from editing parity."),
  globaltonemap: legacy("globaltonemap", "tone", "darktable flags global tonemap deprecated in favor of filmic rgb, so it remains cataloged as legacy only."),
  graduatednd: planned("graduatednd", "tone", "Graduated density needs line geometry and falloff controls that the current recipe model cannot encode."),
  grain: planned("grain", "effects", "Grain is user-editable, but darktableAI has no film-grain contract for radius, strength, and color response yet."),
  hazeremoval: planned("hazeremoval", "tone", "Haze removal is user-editable, but darktableAI has not exposed its dehazing controls yet."),
  highlights: planned("highlights", "raw", "Highlight reconstruction is separate from the shadhi slider mapping and still needs its own raw reconstruction contract."),
  highpass: planned("highpass", "effects", "Highpass needs radius and contrast controls that are not represented in the current contracts."),
  hotpixels: planned("hotpixels", "raw", "Hot pixels is a raw corrective module, but darktableAI has no defect-suppression contract yet."),
  invert: legacy("invert", "color", "darktable flags invert deprecated in favor of negadoctor, so it stays cataloged as legacy only."),
  levels: legacy("levels", "tone", "darktable flags levels deprecated in favor of rgb levels, so keep it cataloged as a legacy surface."),
  lens: planned("lens", "geometry", "Lens correction is tracked in the native capability registry, but the audited snapshot uses `lens.cc` and darktableAI has no truthful lens contract yet.", [], ["lens.correction"]),
  liquify: entry("liquify", { category: "geometry", status: "fork-required", recipeMappings: [], nativeCapabilityIds: ["liquify.warp"], previewSupport: "unsupported", liveSupport: "unsupported", parameterBacklogStatus: "blocked", rationale: "Liquify requires stroke/session data that darktableAI cannot author truthfully without deeper darktable integration." }),
  lowlight: planned("lowlight", "effects", "Lowlight vision needs simulation-specific controls that are outside the current recipe surface."),
  lowpass: planned("lowpass", "effects", "Lowpass needs blur-radius and contrast controls that the current contracts do not encode."),
  lut3d: planned("lut3d", "color", "LUT 3D needs external LUT asset references and mode selection beyond the current recipe model."),
  mask_manager: excluded("mask_manager", "technical", "Hidden internal mask container used to manage drawn masks; it is not a direct editing capability."),
  monochrome: planned("monochrome", "color", "Monochrome needs filter-color and tonal response controls that darktableAI has not modeled yet."),
  negadoctor: planned("negadoctor", "color", "Negadoctor needs film-stock and orange-mask parameters that are not represented in the current recipe contracts."),
  nlmeans: planned("nlmeans", "raw", "Astrophoto denoise needs non-local means controls and domain-specific inputs beyond the current contracts."),
  overexposed: excluded("overexposed", "technical", "Hidden no-history overexposure indicator used for inspection, not as a persisted edit module."),
  overlay: planned("overlay", "effects", "Composite needs raster asset references and blend geometry that darktableAI does not model yet."),
  primaries: planned("primaries", "color", "RGB primaries is user-editable, but darktableAI has no primaries-shift contract yet."),
  profile_gamma: excluded("profile_gamma", "technical", "Unbreak input profile is a technical recovery helper for malformed input profiles, not a normal parity target for automated edits."),
  rasterfile: excluded("rasterfile", "technical", "External raster masks attaches mask files rather than bounded scalar edits, so it is excluded from the editable backlog."),
  rawdenoise: planned("rawdenoise", "raw", "Raw denoise needs raw-domain strength and threshold controls that are not modeled yet."),
  rawoverexposed: excluded("rawoverexposed", "technical", "Hidden raw overexposure indicator with no history stack; it is diagnostic, not an editable capability."),
  rawprepare: planned("rawprepare", "raw", "Raw black/white point is user-editable, but darktableAI has no truthful raw-prepare contract yet."),
  relight: legacy("relight", "tone", "darktable flags fill light deprecated in favor of tone equalizer, so it remains cataloged only as legacy."),
  retouch: entry("retouch", { category: "repair", status: "fork-required", recipeMappings: [], nativeCapabilityIds: ["retouch.spotRemoval"], previewSupport: "unsupported", liveSupport: "unsupported", parameterBacklogStatus: "blocked", rationale: "Retouch depends on complex stroke and shape data that darktableAI cannot author safely without a fork or deeper integration." }),
  rgbcurve: planned("rgbcurve", "tone", "RGB curve needs curve-point arrays and channel linkage semantics that the current recipe model does not expose."),
  rgblevels: entry("rgblevels", { category: "tone", status: "partial", recipeMappings: ["blackPoint", "whitePoint"], nativeCapabilityIds: ["rgblevels.blackPoint", "rgblevels.whitePoint"], previewSupport: "supported", liveSupport: "unsupported", parameterBacklogStatus: "partial", rationale: "darktableAI supports linked black and white endpoints through rgb levels, but the remaining channel and midpoint controls stay backlogged." }),
  rotatepixels: excluded("rotatepixels", "technical", "Hidden rotate-pixels helper module used internally by geometry workflows rather than as a direct user-facing capability."),
  scalepixels: planned("scalepixels", "geometry", "Scale pixels is editable for anamorphic correction, but darktableAI has no pixel-aspect-ratio contract yet."),
  shadhi: entry("shadhi", { category: "tone", status: "partial", recipeMappings: ["highlights", "shadows"], nativeCapabilityIds: ["shadhi.highlights", "shadhi.shadows"], previewSupport: "supported", liveSupport: "unsupported", parameterBacklogStatus: "partial", rationale: "darktableAI supports paired highlight and shadow sliders in shadhi, but the rest of the module parameter family remains backlogged." }),
  sharpen: planned("sharpen", "effects", "Sharpen is editable, but darktableAI has no kernel and threshold contract for it yet."),
  sigmoid: planned("sigmoid", "tone", "Sigmoid is a modern tone mapper, but darktableAI has no truthful sigmoid parameter contract yet."),
  soften: planned("soften", "effects", "Soften needs blur and brightness controls that are not modeled yet."),
  splittoning: planned("splittoning", "color", "Split-toning needs separate shadow and highlight color controls that the current recipe model does not encode."),
  spots: legacy("spots", "repair", "darktable flags spot removal deprecated in favor of retouch, so keep it cataloged as a legacy module only."),
  temperature: entry("temperature", { category: "raw", status: "partial", recipeMappings: ["temperature", "tint"], nativeCapabilityIds: ["temperature.whiteBalancePair"], previewSupport: "supported", liveSupport: "unsupported", parameterBacklogStatus: "partial", rationale: "darktableAI supports paired temperature and tint resolution, but the broader white-balance module surface remains backlogged." }),
  tonecurve: planned("tonecurve", "tone", "Tone curve needs curve-point arrays and per-channel variants that the current recipe surface does not model."),
  toneequal: planned("toneequal", "tone", "Tone equalizer is a planned darktable-native control family, but darktableAI still lacks a truthful zone-based contract.", [], ["toneequal.balance"]),
  useless: excluded("useless", "technical", "This file is darktable's example module template and is not a real user-facing editing capability target."),
  velvia: planned("velvia", "color", "Velvia is editable, but darktableAI has not exposed its saturation-style controls yet."),
  vibrance: legacy("vibrance", "color", "darktable flags the standalone vibrance module deprecated in favor of color balance rgb, so it remains cataloged as legacy."),
  vignette: planned("vignette", "effects", "Vignetting needs center, shape, and falloff parameters that darktableAI does not model yet."),
  watermark: planned("watermark", "effects", "Watermark needs external asset references and placement controls beyond the current recipe model."),
  zonesystem: legacy("zonesystem", "tone", "darktable flags zone system deprecated in favor of tone equalizer, so it is cataloged as legacy only.")
};

export const listDarktableModuleCapabilityCatalog = (): DarktableModuleCapabilityCatalog =>
  DARKTABLE_MODULE_CAPABILITY_CATALOG;

export const AUDITED_DARKTABLE_IOP_SOURCE_PATHS = AUDITED_DARKTABLE_IOP_MODULES.map(
  (module): string => sourcePathOf(module)
);
