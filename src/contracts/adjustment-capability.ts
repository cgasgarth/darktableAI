import type { AdjustmentKind } from "./develop-recipe";

export type AdjustmentCapabilityStatus = "supported" | "planned";

export interface AdjustmentCapability {
  readonly kind: AdjustmentKind;
  readonly status: AdjustmentCapabilityStatus;
  readonly darktableModule: string | null;
  readonly reason: string;
}

export type AdjustmentCapabilityRegistry = Readonly<Record<AdjustmentKind, AdjustmentCapability>>;

export const ADJUSTMENT_CAPABILITY_REGISTRY: AdjustmentCapabilityRegistry = {
  crop: {
    kind: "crop",
    status: "supported",
    darktableModule: "crop",
    reason: "Preview compilation writes normalized crop bounds into the darktable crop module."
  },
  exposure: {
    kind: "exposure",
    status: "supported",
    darktableModule: "exposure",
    reason: "Preview compilation maps the develop recipe exposure value into the darktable exposure module."
  },
  contrast: {
    kind: "contrast",
    status: "supported",
    darktableModule: "colorbalancergb",
    reason: "Preview compilation maps contrast into the darktable color balance rgb module."
  },
  highlights: {
    kind: "highlights",
    status: "supported",
    darktableModule: "shadhi",
    reason: "Preview compilation maps highlights into the darktable shadows and highlights module."
  },
  shadows: {
    kind: "shadows",
    status: "supported",
    darktableModule: "shadhi",
    reason: "Preview compilation maps shadows into the darktable shadows and highlights module."
  },
  whitePoint: {
    kind: "whitePoint",
    status: "supported",
    darktableModule: "rgblevels",
    reason:
      "Preview compilation maps whitePoint to the linked-channel white endpoint in darktable rgb levels while keeping the midpoint neutral between the chosen endpoints."
  },
  blackPoint: {
    kind: "blackPoint",
    status: "supported",
    darktableModule: "rgblevels",
    reason:
      "Preview compilation maps blackPoint to the linked-channel black endpoint in darktable rgb levels while keeping the midpoint neutral between the chosen endpoints."
  },
  whites: {
    kind: "whites",
    status: "planned",
    darktableModule: null,
    reason:
      "darktable has no single preview-sidecar whites slider mapping; use explicit whitePoint for rgblevels endpoint control instead of pretending whites is equivalent."
  },
  blacks: {
    kind: "blacks",
    status: "planned",
    darktableModule: null,
    reason:
      "darktable has no single preview-sidecar blacks slider mapping; use explicit blackPoint for rgblevels endpoint control instead of pretending blacks is equivalent."
  },
  temperature: {
    kind: "temperature",
    status: "supported",
    darktableModule: "temperature",
    reason:
      "Preview compilation resolves truthful darktable temperature module multipliers through the darktable-wb-resolve helper, but temperature must be paired with tint in the same recipe."
  },
  tint: {
    kind: "tint",
    status: "supported",
    darktableModule: "temperature",
    reason:
      "Preview compilation resolves truthful darktable temperature module multipliers through the darktable-wb-resolve helper, but tint must be paired with temperature in the same recipe."
  },
  saturation: {
    kind: "saturation",
    status: "supported",
    darktableModule: "colorbalancergb",
    reason: "Preview compilation maps saturation into the darktable color balance rgb module."
  },
  vibrance: {
    kind: "vibrance",
    status: "supported",
    darktableModule: "colorbalancergb",
    reason: "Preview compilation maps vibrance into the darktable color balance rgb module."
  }
};

export const listAdjustmentCapabilities = (): AdjustmentCapabilityRegistry =>
  ADJUSTMENT_CAPABILITY_REGISTRY;
