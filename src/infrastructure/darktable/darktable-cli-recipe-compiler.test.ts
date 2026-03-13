import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { DevelopRecipe } from "../../contracts/develop-recipe";
import { LocalRunLayout } from "../runtime/local-run-layout";
import { DarktableCliRecipeCompiler } from "./darktable-cli-recipe-compiler";

describe("DarktableCliRecipeCompiler", (): void => {
  const tempDirectories: Array<string> = [];

  afterEach((): void => {
    for (const directory of tempDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  test("writes a real XMP sidecar with crop, exposure, shadhi, rgblevels, and color balance rgb modules", async (): Promise<void> => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-compiler-"));
    tempDirectories.push(projectRoot);
    const compiler = new DarktableCliRecipeCompiler(
      new StubIdGenerator(["compile-123"]),
      new LocalRunLayout(projectRoot),
      new StubTemperatureModuleResolver()
    );
    const recipe: DevelopRecipe = {
      recipeId: "recipe-123",
      sourceAssetPath: "/fixtures/source.ARW",
        adjustments: [
          { kind: "crop", left: 0.1, top: 0.2, width: 0.3, height: 0.4 },
          { kind: "exposure", exposure: 0.25 },
          { kind: "shadows", shadows: 0.18 },
          { kind: "highlights", highlights: -0.12 },
          { kind: "blackPoint", blackPoint: 0.1 },
          { kind: "whitePoint", whitePoint: 0.9 },
          { kind: "vibrance", vibrance: -0.2 },
          { kind: "contrast", contrast: 0.35 },
          { kind: "saturation", saturation: 0.15 }
      ]
    };

    const compiled = await compiler.compile(recipe);
    const xmpDocument = await Bun.file(compiled.xmpSidecarPath).text();

    expect(compiled).toEqual({
      compileId: "compile-123",
      recipeId: "recipe-123",
      sourceAssetPath: "/fixtures/source.ARW",
      compiledArtifactPath: path.join(
        projectRoot,
        "artifacts",
        "preview",
        "recipes",
        "compile-123.xmp"
      ),
      xmpSidecarPath: path.join(projectRoot, "artifacts", "preview", "recipes", "compile-123.xmp"),
      modules: [
        { operation: "crop", modversion: 1 },
        { operation: "exposure", modversion: 6 },
        { operation: "shadhi", modversion: 5 },
        { operation: "rgblevels", modversion: 1 },
        { operation: "colorbalancergb", modversion: 5 }
      ]
    });
    expect(xmpDocument).toContain('darktable:history_end="4"');
    expect(xmpDocument).toContain('xmpMM:DerivedFrom="source.ARW"');
    expect(xmpDocument).toContain('darktable:operation="crop"');
    expect(xmpDocument).toContain(
      'darktable:params="cdcccc3dcdcc4c3ecdcccc3e9a99193fffffffffffffffff"'
    );
    expect(xmpDocument).toContain('darktable:operation="exposure"');
    expect(xmpDocument).toContain(
      'darktable:params="00000000000000000000803e00004842000080c000000000"'
    );
    expect(xmpDocument).toContain('darktable:operation="shadhi"');
    expect(xmpDocument).toContain(
      'darktable:params="000000000000c8420000904100000000000040c100000000000048420000c842000048427f000000bd37863501000000"'
    );
    expect(xmpDocument).toContain('darktable:operation="rgblevels"');
    expect(xmpDocument).toContain(
      'darktable:params="0000000001000000cdcccc3d0000003f6666663fcdcccc3d0000003f6666663fcdcccc3d0000003f6666663f"'
    );
    expect(xmpDocument).toContain('darktable:operation="colorbalancergb"');
    expect(xmpDocument).toContain(
      'darktable:params="0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000803f000000000000803f000000000000000000000000000000009a99193e000000000000000000000000000000000000000000000000000000000000000091ed3c3ecdcc4cbe91ed3c3e3333b33e01000000"'
    );
  });

  test("rejects still-unsupported adjustment kinds explicitly", async (): Promise<void> => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-compiler-"));
    tempDirectories.push(projectRoot);
    const compiler = new DarktableCliRecipeCompiler(
      new StubIdGenerator(["compile-unsupported"]),
      new LocalRunLayout(projectRoot)
    );

    try {
      await compiler.compile({
        recipeId: "recipe-unsupported",
        sourceAssetPath: "/fixtures/source.ARW",
        adjustments: [
          { kind: "whites", whites: 0.1 },
          { kind: "blacks", blacks: -0.1 },
          { kind: "temperature", temperature: 6000 },
          { kind: "tint", tint: 1.1 }
        ]
      });
      throw new Error("Expected unsupported adjustment compilation to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "Unsupported develop adjustments for darktable-cli preview compilation: " +
          "whites (darktable has no single preview-sidecar whites slider mapping; use explicit whitePoint for rgblevels endpoint control instead of pretending whites is equivalent.), " +
          "blacks (darktable has no single preview-sidecar blacks slider mapping; use explicit blackPoint for rgblevels endpoint control instead of pretending blacks is equivalent.)"
        );
    }
  });

  test("uses defaults when only one rgb levels endpoint is supplied", async (): Promise<void> => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-compiler-"));
    tempDirectories.push(projectRoot);
    const compiler = new DarktableCliRecipeCompiler(
      new StubIdGenerator(["compile-rgblevels"]),
      new LocalRunLayout(projectRoot),
      new StubTemperatureModuleResolver()
    );

    const compiled = await compiler.compile({
      recipeId: "recipe-rgblevels",
      sourceAssetPath: "/fixtures/source.ARW",
      adjustments: [{ kind: "blackPoint", blackPoint: 0.08 }]
    });
    const xmpDocument = await Bun.file(compiled.xmpSidecarPath).text();

    expect(compiled.modules).toEqual([{ operation: "rgblevels", modversion: 1 }]);
    expect(xmpDocument).toContain(
      'darktable:params="00000000010000000ad7a33d713d0a3f0000803f0ad7a33d713d0a3f0000803f0ad7a33d713d0a3f0000803f"'
    );
  });

  test("writes a truthful temperature module when temperature and tint are paired", async (): Promise<void> => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-compiler-"));
    tempDirectories.push(projectRoot);
    const resolver = new StubTemperatureModuleResolver();
    const compiler = new DarktableCliRecipeCompiler(
      new StubIdGenerator(["compile-temperature"]),
      new LocalRunLayout(projectRoot),
      resolver
    );

    const compiled = await compiler.compile({
      recipeId: "recipe-temperature",
      sourceAssetPath: "/fixtures/source.ARW",
      adjustments: [
        { kind: "temperature", temperature: 5500 },
        { kind: "tint", tint: 1 }
      ]
    });
    const xmpDocument = await Bun.file(compiled.xmpSidecarPath).text();

    expect(resolver.requests).toEqual([
      {
        sourceAssetPath: "/fixtures/source.ARW",
        temperature: 5500,
        tint: 1
      }
    ]);
    expect(compiled.modules).toEqual([{ operation: "temperature", modversion: 4 }]);
    expect(xmpDocument).toContain('darktable:operation="temperature"');
    expect(xmpDocument).toContain(
      'darktable:params="13341e400000803fc9abbf3fda99833f02000000"'
    );
  });

  test("rejects lone temperature or tint adjustments explicitly", async (): Promise<void> => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), "darktableai-compiler-"));
    tempDirectories.push(projectRoot);
    const compiler = new DarktableCliRecipeCompiler(
      new StubIdGenerator(["compile-lone-temperature"]),
      new LocalRunLayout(projectRoot),
      new StubTemperatureModuleResolver()
    );

    const compilation = compiler.compile({
        recipeId: "recipe-lone-temperature",
        sourceAssetPath: "/fixtures/source.ARW",
        adjustments: [{ kind: "temperature", temperature: 5500 }]
      });

    try {
      await compilation;
      throw new Error("Expected lone temperature compilation to fail.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "Temperature and tint must be provided together so darktableAI can resolve truthful darktable temperature module params."
      );
    }
  });
});

class StubIdGenerator {
  private index = 0;

  public constructor(private readonly values: ReadonlyArray<string>) {}

  public generate(): string {
    const value = this.values[this.index];

    if (value === undefined) {
      throw new Error("Id generator has no more values configured.");
    }

    this.index += 1;
    return value;
  }
}

class StubTemperatureModuleResolver {
  public readonly requests: Array<{
    readonly sourceAssetPath: string;
    readonly temperature: number;
    readonly tint: number;
  }> = [];

  public resolve(request: {
    readonly sourceAssetPath: string;
    readonly temperature: number;
    readonly tint: number;
  }): Promise<{
    readonly red: number;
    readonly green: number;
    readonly blue: number;
    readonly various: number;
    readonly preset: number;
  }> {
    this.requests.push(request);

    return Promise.resolve({
      red: 2.47192837,
      green: 1,
      blue: 1.49742997,
      various: 1.02813265,
      preset: 2
    });
  }
}
