import type { CropAdjustment } from "../../contracts/develop-recipe";
import type { ResolvedTemperatureModuleParams } from "../../application/ports/temperature-module-resolver";

const COLOR_BALANCE_FIELD_COUNT = 32;
const SHADHI_UNBOUND_DEFAULT_FLAGS = 127;
const SHADHI_BILATERAL_ALGORITHM = 1;
const SHADHI_LOW_APPROXIMATION = 0.000001;
const SATURATION_FORMULA_JZAZBZ = 1;

export const packCropParams = (crop: CropAdjustment): string =>
  packBytes((view: DataView): void => {
    view.setFloat32(0, crop.left, true);
    view.setFloat32(4, crop.top, true);
    view.setFloat32(8, crop.left + crop.width, true);
    view.setFloat32(12, crop.top + crop.height, true);
    view.setInt32(16, -1, true);
    view.setInt32(20, -1, true);
  }, 24);

export const packExposureParams = (exposure: number): string =>
  packBytes((view: DataView): void => {
    view.setInt32(0, 0, true);
    view.setFloat32(4, 0, true);
    view.setFloat32(8, exposure, true);
    view.setFloat32(12, 50, true);
    view.setFloat32(16, -4, true);
    view.setUint32(20, 0, true);
  }, 24);

export const packColorBalanceRgbParams = (values: {
  readonly contrast: number;
  readonly saturation: number;
  readonly vibrance: number;
}): string => {
  const fields = new Float32Array(COLOR_BALANCE_FIELD_COUNT);
  fields[12] = 1;
  fields[14] = 1;
  fields[19] = values.saturation;
  fields[28] = 0.1845;
  fields[29] = values.vibrance;
  fields[30] = 0.1845;
  fields[31] = values.contrast;

  return packBytes((view: DataView): void => {
    for (let index = 0; index < fields.length; index += 1) {
      view.setFloat32(index * 4, fields[index] ?? 0, true);
    }

    view.setInt32(fields.length * 4, SATURATION_FORMULA_JZAZBZ, true);
  }, fields.length * 4 + 4);
};

export const packShadowsHighlightsParams = (values: {
  readonly shadows: number;
  readonly highlights: number;
}): string =>
  packBytes((view: DataView): void => {
    view.setInt32(0, 0, true);
    view.setFloat32(4, 100, true);
    view.setFloat32(8, values.shadows * 100, true);
    view.setFloat32(12, 0, true);
    view.setFloat32(16, values.highlights * 100, true);
    view.setFloat32(20, 0, true);
    view.setFloat32(24, 50, true);
    view.setFloat32(28, 100, true);
    view.setFloat32(32, 50, true);
    view.setUint32(36, SHADHI_UNBOUND_DEFAULT_FLAGS, true);
    view.setFloat32(40, SHADHI_LOW_APPROXIMATION, true);
    view.setInt32(44, SHADHI_BILATERAL_ALGORITHM, true);
  }, 48);

export const packTemperatureParams = (values: ResolvedTemperatureModuleParams): string =>
  packBytes((view: DataView): void => {
    view.setFloat32(0, values.red, true);
    view.setFloat32(4, values.green, true);
    view.setFloat32(8, values.blue, true);
    view.setFloat32(12, values.various, true);
    view.setInt32(16, values.preset, true);
  }, 20);

export const packRgbLevelsParams = (values: {
  readonly blackPoint: number;
  readonly whitePoint: number;
}): string => {
  const midPoint = (values.blackPoint + values.whitePoint) / 2;

  return packBytes((view: DataView): void => {
    view.setInt32(0, 0, true);
    view.setInt32(4, 1, true);

    for (let channel = 0; channel < 3; channel += 1) {
      const offset = 8 + channel * 12;
      view.setFloat32(offset, values.blackPoint, true);
      view.setFloat32(offset + 4, midPoint, true);
      view.setFloat32(offset + 8, values.whitePoint, true);
    }
  }, 44);
};

const packBytes = (write: (view: DataView) => void, length: number): string => {
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  write(view);

  return Buffer.from(buffer).toString("hex");
};
