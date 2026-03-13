import type { AdjustmentOperation } from "../../contracts/develop-recipe";

import { packRgbLevelsParams } from "./darktable-cli-module-param-packers";

export const buildRgbLevelsModule = (
  adjustments: ReadonlyArray<AdjustmentOperation>
): Readonly<{
  operation: string;
  modversion: number;
  params: string;
}> => ({
  operation: "rgblevels",
  modversion: 1,
  params: packRgbLevelsParams({
    blackPoint: findRgbLevelsValue(adjustments, "blackPoint", 0),
    whitePoint: findRgbLevelsValue(adjustments, "whitePoint", 1)
  })
});

const findRgbLevelsValue = (
  adjustments: ReadonlyArray<AdjustmentOperation>,
  kind: "blackPoint" | "whitePoint",
  defaultValue: number
): number => {
  const adjustment = adjustments.find(
    (candidate: AdjustmentOperation): boolean => candidate.kind === kind
  );

  if (adjustment === undefined) {
    return defaultValue;
  }

  if (adjustment.kind === "blackPoint") {
    return adjustment.blackPoint;
  }

  if (adjustment.kind === "whitePoint") {
    return adjustment.whitePoint;
  }

  throw new Error(`Expected ${kind} adjustment, received ${adjustment.kind}.`);
};
