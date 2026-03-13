import { describe, expect, test } from "bun:test";

import { listAdjustmentCapabilities } from "./adjustment-capability";

describe("adjustment capability registry", () => {
  test("tracks every develop adjustment kind", () => {
    expect(Object.keys(listAdjustmentCapabilities()).sort()).toEqual([
      "blackPoint",
      "blacks",
      "contrast",
      "crop",
      "exposure",
      "highlights",
      "saturation",
      "shadows",
      "temperature",
      "tint",
      "vibrance",
      "whitePoint",
      "whites"
    ]);
  });

  test("marks preview-backed adjustments as supported with module mappings", () => {
    const capabilities = listAdjustmentCapabilities();

    expect(capabilities.crop).toMatchObject({
      status: "supported",
      darktableModule: "crop"
    });
    expect(capabilities.exposure).toMatchObject({
      status: "supported",
      darktableModule: "exposure"
    });
    expect(capabilities.contrast).toMatchObject({
      status: "supported",
      darktableModule: "colorbalancergb"
    });
    expect(capabilities.highlights).toMatchObject({
      status: "supported",
      darktableModule: "shadhi"
    });
    expect(capabilities.shadows).toMatchObject({
      status: "supported",
      darktableModule: "shadhi"
    });
    expect(capabilities.blackPoint).toMatchObject({
      status: "supported",
      darktableModule: "rgblevels"
    });
    expect(capabilities.whitePoint).toMatchObject({
      status: "supported",
      darktableModule: "rgblevels"
    });
    expect(capabilities.temperature).toMatchObject({
      status: "supported",
      darktableModule: "temperature"
    });
    expect(capabilities.tint).toMatchObject({
      status: "supported",
      darktableModule: "temperature"
    });
    expect(capabilities.saturation).toMatchObject({
      status: "supported",
      darktableModule: "colorbalancergb"
    });
    expect(capabilities.vibrance).toMatchObject({
      status: "supported",
      darktableModule: "colorbalancergb"
    });
  });

  test("marks currently unsupported adjustments as planned with explicit reasons", () => {
    const capabilities = listAdjustmentCapabilities();

    expect(capabilities.whites).toMatchObject({
      status: "planned",
      darktableModule: null
    });
    expect(capabilities.blacks).toMatchObject({
      status: "planned",
      darktableModule: null
    });
    expect(capabilities.whites.reason.length).toBeGreaterThan(0);
    expect(capabilities.blacks.reason.length).toBeGreaterThan(0);
  });
});
