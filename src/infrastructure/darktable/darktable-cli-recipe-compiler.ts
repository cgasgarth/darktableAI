import path from "node:path";

import type {
  CompiledDarktableModule,
  CompiledDevelopRecipe
} from "../../application/models/render-artifacts";
import type { IdGenerator } from "../../application/ports/id-generator";
import type {
  TemperatureModuleResolver
} from "../../application/ports/temperature-module-resolver";
import type {
  AdjustmentOperation,
  CropAdjustment,
  DevelopRecipe,
  ExposureAdjustment,
  TemperatureAdjustment,
  TintAdjustment,
} from "../../contracts/develop-recipe";
import { ADJUSTMENT_CAPABILITY_REGISTRY } from "../../contracts/adjustment-capability";
import {
  packColorBalanceRgbParams,
  packCropParams,
  packExposureParams,
  packShadowsHighlightsParams,
  packTemperatureParams
} from "./darktable-cli-module-param-packers";
import { DarktableWbResolveTemperatureModuleResolver } from "./darktable-wb-resolve-temperature-module-resolver";
import { buildRgbLevelsModule } from "./darktable-cli-rgblevels-module";
import { LocalRunLayout } from "../runtime/local-run-layout";

const DEFAULT_BLENDOP_PARAMS = "gz14eJxjYIAACQYYOOHEgAYY0QVwggZ7CB6pfNoAAEkgGQQ=";

type SupportedAdjustmentKind = Exclude<AdjustmentOperation["kind"], "whites" | "blacks">;
type CompiledModuleDocument = Readonly<{
  operation: string;
  modversion: number;
  params: string;
}>;

export class DarktableCliRecipeCompiler {
  public constructor(
    private readonly idGenerator: IdGenerator = { generate: (): string => crypto.randomUUID() },
    private readonly runLayout: LocalRunLayout = new LocalRunLayout(),
    private readonly temperatureModuleResolver: TemperatureModuleResolver =
      new DarktableWbResolveTemperatureModuleResolver()
  ) {}

  public async compile(recipe: DevelopRecipe): Promise<CompiledDevelopRecipe> {
    const compileId = this.idGenerator.generate();
    const compiledModules = await this.buildCompiledModules(recipe);
    const xmpSidecarPath = this.runLayout.getPreviewRecipeSidecarPath(compileId);
    const xmpDocument = this.buildXmpDocument(recipe, compiledModules);

    await Bun.write(xmpSidecarPath, xmpDocument);

    return {
      compileId,
      recipeId: recipe.recipeId,
      sourceAssetPath: recipe.sourceAssetPath,
      compiledArtifactPath: xmpSidecarPath,
      xmpSidecarPath,
      modules: compiledModules.map(
        (module: CompiledModuleDocument): CompiledDarktableModule => ({
          operation: module.operation,
          modversion: module.modversion
        })
      )
    };
  }

  private async buildCompiledModules(
    recipe: DevelopRecipe
  ): Promise<ReadonlyArray<CompiledModuleDocument>> {
    const { adjustments } = recipe;
    const unsupportedKinds = this.findUnsupportedAdjustmentKinds(adjustments);

    if (unsupportedKinds.length > 0) {
      throw new Error(this.buildUnsupportedAdjustmentMessage(unsupportedKinds));
    }

    this.assertTemperatureTintPairing(adjustments);

    const modules: Array<CompiledModuleDocument> = [];
    let colorBalanceInserted = false;
    let rgbLevelsInserted = false;
    let shadowsHighlightsInserted = false;
    let temperatureInserted = false;

    for (const adjustment of adjustments) {
      switch (adjustment.kind) {
        case "crop":
          modules.push(this.buildCropModule(adjustment));
          continue;
        case "exposure":
          modules.push(this.buildExposureModule(adjustment));
          continue;
        case "contrast":
        case "saturation":
        case "vibrance":
          if (!colorBalanceInserted) {
            modules.push(this.buildColorBalanceRgbModule(adjustments));
            colorBalanceInserted = true;
          }

          continue;
        case "highlights":
        case "shadows":
          if (!shadowsHighlightsInserted) {
            modules.push(this.buildShadowsHighlightsModule(adjustments));
            shadowsHighlightsInserted = true;
          }

          continue;
        case "blackPoint":
        case "whitePoint":
          if (!rgbLevelsInserted) {
            modules.push(buildRgbLevelsModule(adjustments));
            rgbLevelsInserted = true;
          }

          continue;
        case "temperature":
        case "tint":
          if (!temperatureInserted) {
            modules.push(await this.buildTemperatureModule(recipe.sourceAssetPath, adjustments));
            temperatureInserted = true;
          }

          continue;
        case "whites":
        case "blacks":
          throw new Error(`Unsupported adjustment kind reached compiler: ${adjustment.kind}`);
      }
    }

    return modules;
  }

  private findUnsupportedAdjustmentKinds(
    adjustments: ReadonlyArray<AdjustmentOperation>
  ): ReadonlyArray<Exclude<AdjustmentOperation["kind"], SupportedAdjustmentKind>> {
    const unsupported = adjustments
      .map(
        (
          adjustment: AdjustmentOperation
        ): Exclude<AdjustmentOperation["kind"], SupportedAdjustmentKind> | null =>
        this.isSupportedKind(adjustment.kind) ? null : adjustment.kind
      )
      .filter(
        (
          kind: Exclude<AdjustmentOperation["kind"], SupportedAdjustmentKind> | null
        ): kind is Exclude<AdjustmentOperation["kind"], SupportedAdjustmentKind> => kind !== null
      );

    return [...new Set(unsupported)];
  }

  private buildUnsupportedAdjustmentMessage(
    kinds: ReadonlyArray<Exclude<AdjustmentOperation["kind"], SupportedAdjustmentKind>>
  ): string {
    return `Unsupported develop adjustments for darktable-cli preview compilation: ${kinds
      .map((kind): string => `${kind} (${ADJUSTMENT_CAPABILITY_REGISTRY[kind].reason})`)
      .join(", ")}`;
  }

  private isSupportedKind(kind: AdjustmentOperation["kind"]): kind is SupportedAdjustmentKind {
    return ADJUSTMENT_CAPABILITY_REGISTRY[kind].status === "supported";
  }

  private assertTemperatureTintPairing(adjustments: ReadonlyArray<AdjustmentOperation>): void {
    const hasTemperature = adjustments.some(
      (adjustment: AdjustmentOperation): boolean => adjustment.kind === "temperature"
    );
    const hasTint = adjustments.some(
      (adjustment: AdjustmentOperation): boolean => adjustment.kind === "tint"
    );

    if (hasTemperature !== hasTint) {
      throw new Error(
        "Temperature and tint must be provided together so darktableAI can resolve truthful darktable temperature module params."
      );
    }
  }

  private buildCropModule(crop: CropAdjustment): CompiledModuleDocument {
    return {
      operation: "crop",
      modversion: 1,
      params: packCropParams(crop)
    };
  }

  private buildExposureModule(exposure: ExposureAdjustment): CompiledModuleDocument {
    return {
      operation: "exposure",
      modversion: 6,
      params: packExposureParams(exposure.exposure)
    };
  }

  private buildColorBalanceRgbModule(
    adjustments: ReadonlyArray<AdjustmentOperation>
  ): CompiledModuleDocument {
    const contrast = this.findAdjustmentValue(adjustments, "contrast");
    const saturation = this.findAdjustmentValue(adjustments, "saturation");
    const vibrance = this.findAdjustmentValue(adjustments, "vibrance");

    return {
      operation: "colorbalancergb",
      modversion: 5,
      params: packColorBalanceRgbParams({
        contrast,
        saturation,
        vibrance
      })
    };
  }

  private buildShadowsHighlightsModule(
    adjustments: ReadonlyArray<AdjustmentOperation>
  ): CompiledModuleDocument {
    const shadows = this.findAdjustmentValue(adjustments, "shadows");
    const highlights = this.findAdjustmentValue(adjustments, "highlights");

    return {
      operation: "shadhi",
      modversion: 5,
      params: packShadowsHighlightsParams({
        shadows,
        highlights
      })
    };
  }

  private async buildTemperatureModule(
    sourceAssetPath: string,
    adjustments: ReadonlyArray<AdjustmentOperation>
  ): Promise<CompiledModuleDocument> {
    const resolved = await this.temperatureModuleResolver.resolve({
      sourceAssetPath,
      temperature: this.findTemperatureTintAdjustment(adjustments, "temperature").temperature,
      tint: this.findTemperatureTintAdjustment(adjustments, "tint").tint
    });

    return {
      operation: "temperature",
      modversion: 4,
      params: packTemperatureParams(resolved)
    };
  }

  private findAdjustmentValue(
    adjustments: ReadonlyArray<AdjustmentOperation>,
    kind: "contrast" | "highlights" | "saturation" | "shadows" | "vibrance"
  ): number {
    const adjustment = adjustments.find(
      (candidate: AdjustmentOperation): boolean => candidate.kind === kind
    );

    if (adjustment === undefined) {
      return 0;
    }

    switch (adjustment.kind) {
      case "contrast":
        return adjustment.contrast;
      case "highlights":
        return adjustment.highlights;
      case "saturation":
        return adjustment.saturation;
      case "shadows":
        return adjustment.shadows;
      case "vibrance":
        return adjustment.vibrance;
      case "crop":
      case "exposure":
      case "blackPoint":
      case "whitePoint":
      case "whites":
      case "blacks":
      case "temperature":
      case "tint":
        throw new Error(`Expected ${kind} adjustment, received ${adjustment.kind}.`);
    }
  }

  private findTemperatureTintAdjustment(
    adjustments: ReadonlyArray<AdjustmentOperation>,
    kind: "temperature"
  ): TemperatureAdjustment;
  private findTemperatureTintAdjustment(
    adjustments: ReadonlyArray<AdjustmentOperation>,
    kind: "tint"
  ): TintAdjustment;
  private findTemperatureTintAdjustment(
    adjustments: ReadonlyArray<AdjustmentOperation>,
    kind: "temperature" | "tint"
  ): TemperatureAdjustment | TintAdjustment {
    const adjustment = adjustments.find(
      (candidate: AdjustmentOperation): boolean => candidate.kind === kind
    );

    if (adjustment?.kind !== kind) {
      throw new Error(`Expected ${kind} adjustment to be present.`);
    }

    return adjustment;
  }

  private buildXmpDocument(
    recipe: DevelopRecipe,
    modules: ReadonlyArray<CompiledModuleDocument>
  ): string {
    const sourceAssetName = path.basename(recipe.sourceAssetPath);
    const historyEnd = String(modules.length - 1);
    const historyItems = modules
      .map(
        (module: CompiledModuleDocument, index: number): string => `     <rdf:li
      darktable:num="${String(index)}"
      darktable:operation="${module.operation}"
      darktable:enabled="1"
      darktable:modversion="${String(module.modversion)}"
      darktable:params="${module.params}"
      darktable:multi_name=""
      darktable:multi_priority="0"
      darktable:blendop_version="10"
      darktable:blendop_params="${DEFAULT_BLENDOP_PARAMS}"/>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 4.4.0-Exiv2">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
    xmlns:darktable="http://darktable.sf.net/"
   xmpMM:DerivedFrom="${this.escapeXmlAttribute(sourceAssetName)}"
   darktable:xmp_version="4"
   darktable:raw_params="0"
   darktable:auto_presets_applied="1"
   darktable:history_end="${historyEnd}"
   darktable:iop_order_version="2">
   <darktable:masks_history>
    <rdf:Seq/>
   </darktable:masks_history>
   <darktable:history>
    <rdf:Seq>
${historyItems}
    </rdf:Seq>
   </darktable:history>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
`;
  }

  private escapeXmlAttribute(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
