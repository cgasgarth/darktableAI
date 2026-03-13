import { describe, expect, test } from "bun:test";

import { listDarktableNativeCapabilities } from "./darktable-native-capability";

describe("darktable native capability registry", () => {
  test("enumerates supported and planned darktable-native controls beyond recipe-backed adjustments", () => {
    const capabilities = listDarktableNativeCapabilities();

    expect(Object.keys(capabilities).sort()).toEqual([
      "colorbalancergb.contrast",
      "colorbalancergb.saturation",
      "colorbalancergb.vibrance",
      "colorzones.hueVsHue",
      "colorzones.hueVsSaturation",
      "crop.bounds",
      "denoiseprofile.profiledDenoise",
      "diffuse.captureSharpen",
      "exposure.exposure",
      "filmicrgb.blacks",
      "filmicrgb.latitude",
      "filmicrgb.whites",
      "lens.correction",
      "liquify.warp",
      "retouch.spotRemoval",
      "rgblevels.blackPoint",
      "rgblevels.whitePoint",
      "shadhi.highlights",
      "shadhi.shadows",
      "temperature.whiteBalancePair",
      "toneequal.balance"
    ]);

    expect(capabilities["crop.bounds"]).toMatchObject({
      status: "supported",
      previewCompilationStatus: "supported",
      recipeAdjustmentKinds: ["crop"]
    });
    expect(capabilities["temperature.whiteBalancePair"]).toMatchObject({
      status: "supported",
      previewCompilationStatus: "supported",
      recipeAdjustmentKinds: ["temperature", "tint"]
    });
    expect(capabilities["filmicrgb.whites"]).toMatchObject({
      status: "planned",
      previewCompilationStatus: "unsupported",
      recipeAdjustmentKinds: ["whites"]
    });
    expect(capabilities["retouch.spotRemoval"]).toMatchObject({
      status: "fork-required",
      previewCompilationStatus: "unsupported",
      recipeAdjustmentKinds: []
    });
  });

  test("requires explicit reasons whenever a darktable-native control is not preview-supported", () => {
    for (const capability of Object.values(listDarktableNativeCapabilities())) {
      if (capability.previewCompilationStatus === "supported") {
        expect(capability.status).toBe("supported");
        continue;
      }

      expect(capability.status === "planned" || capability.status === "fork-required").toBe(true);
      expect(capability.reason.length).toBeGreaterThan(0);
    }
  });
});
