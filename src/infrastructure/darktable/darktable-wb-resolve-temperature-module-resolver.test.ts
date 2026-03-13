import { describe, expect, test } from "bun:test";

import { DarktableWbResolveTemperatureModuleResolver } from "./darktable-wb-resolve-temperature-module-resolver";

describe("DarktableWbResolveTemperatureModuleResolver", (): void => {
  test("invokes darktable-wb-resolve and returns strict temperature module params", async (): Promise<void> => {
    const processRunner = new StubProcessRunner({
      exitCode: 0,
      stdout: JSON.stringify({
        params: {
          red: 2.47192837,
          green: 1,
          blue: 1.49742997,
          various: 1.02813265,
          preset: 2
        }
      }),
      stderr: ""
    });
    const resolver = new DarktableWbResolveTemperatureModuleResolver(
      {
        binaryPath: "/opt/darktable/bin/darktable-wb-resolve",
        coreOptions: ["--datadir", "/opt/darktable/share/darktable", "--conf", "opencl=FALSE"]
      },
      processRunner
    );

    const result = await resolver.resolve({
      sourceAssetPath: "/fixtures/source.ARW",
      temperature: 5500,
      tint: 1.05
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/bin/darktable-wb-resolve",
        "/fixtures/source.ARW",
        "5500",
        "1.05",
        "--core",
        "--datadir",
        "/opt/darktable/share/darktable",
        "--conf",
        "opencl=FALSE"
      ]
    ]);
    expect(result).toEqual({
      red: 2.47192837,
      green: 1,
      blue: 1.49742997,
      various: 1.02813265,
      preset: 2
    });
  });

  test("rejects malformed helper payloads", async (): Promise<void> => {
    const resolver = new DarktableWbResolveTemperatureModuleResolver(
      {
        binaryPath: "/opt/darktable/bin/darktable-wb-resolve",
        coreOptions: []
      },
      new StubProcessRunner({
        exitCode: 0,
        stdout: JSON.stringify({
          params: {
            red: 2,
            green: 1,
            blue: 1.5,
            various: 1,
            preset: 2.5
          }
        }),
        stderr: ""
      })
    );

    const resolution = resolver.resolve({
        sourceAssetPath: "/fixtures/source.ARW",
        temperature: 5500,
        tint: 1
      });

    try {
      await resolution;
      throw new Error("Expected malformed helper payload to be rejected.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "darktable-wb-resolve field 'params.preset' must be an integer."
      );
    }
  });
});

class StubProcessRunner {
  public readonly commands: Array<ReadonlyArray<string>> = [];

  public constructor(
    private readonly response: {
      readonly exitCode: number;
      readonly stdout: string;
      readonly stderr: string;
    }
  ) {}

  public run(command: ReadonlyArray<string>): Promise<{
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
  }> {
    this.commands.push([...command]);
    return Promise.resolve(this.response);
  }
}
