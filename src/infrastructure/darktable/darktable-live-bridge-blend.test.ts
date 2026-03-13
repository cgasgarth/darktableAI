import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge blend", (): void => {
  test("invokes apply-module-instance-blend with opacity JSON and parses the response", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 23,
            historyChangeSequence: 10,
            imageLoadSequence: 2
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "exposure#0#0#",
            moduleOp: "exposure",
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            previousOpacity: 100,
            requestedOpacity: 75,
            currentOpacity: 75,
            historyBefore: 2,
            historyAfter: 3,
            requestedHistoryEnd: 3
          },
          snapshot: createSnapshot(75)
        }),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      { binaryPath: "/opt/darktable/build/bin/darktable-live-bridge" },
      processRunner,
      undefined,
      createNowMilliseconds([5000, 5008])
    );

    const result = await bridge.applyModuleInstanceBlend({
      instanceKey: "exposure#0#0#",
      opacity: 75
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-blend",
        "exposure#0#0#",
        '{"opacity":75}'
      ]
    ]);
    expect(result.moduleBlend).toEqual({
      targetInstanceKey: "exposure#0#0#",
      moduleOp: "exposure",
      iopOrder: 12,
      multiPriority: 0,
      multiName: "0",
      previousOpacity: 100,
      requestedOpacity: 75,
      currentOpacity: 75,
      historyBefore: 2,
      historyAfter: 3,
      requestedHistoryEnd: 3
    });
    if (result.status !== "ok") {
      throw new Error("Expected ok module blend response.");
    }
    expect(result.snapshot.moduleStack[0]?.blend).toEqual({
      supported: true,
      masksSupported: true,
      opacity: 75,
      blendMode: "normal",
      reverseOrder: false
    });
  });

  test("invokes apply-module-instance-blend with blend mode and reverse order JSON", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 24,
            historyChangeSequence: 11,
            imageLoadSequence: 2
          },
          activeImage: {
            imageId: 7,
            directoryPath: "/photos",
            fileName: "frame.ARW",
            sourceAssetPath: "/photos/frame.ARW"
          },
          moduleBlend: {
            targetInstanceKey: "colorbalancergb#7#1#",
            moduleOp: "colorbalancergb",
            iopOrder: 18,
            multiPriority: 1,
            multiName: "mask",
            previousBlendMode: "normal",
            requestedBlendMode: "multiply",
            currentBlendMode: "multiply",
            previousReverseOrder: false,
            requestedReverseOrder: true,
            currentReverseOrder: true,
            historyBefore: 3,
            historyAfter: 4,
            requestedHistoryEnd: 4
          },
          snapshot: createSnapshot(75)
        }),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      { binaryPath: "/opt/darktable/build/bin/darktable-live-bridge" },
      processRunner,
      undefined,
      createNowMilliseconds([6000, 6009])
    );

    const result = await bridge.applyModuleInstanceBlend({
      instanceKey: "colorbalancergb#7#1#",
      blendMode: "multiply",
      reverseOrder: true
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-blend",
        "colorbalancergb#7#1#",
        '{"blendMode":"multiply","reverseOrder":true}'
      ]
    ]);
    expect(result.moduleBlend).toEqual({
      targetInstanceKey: "colorbalancergb#7#1#",
      moduleOp: "colorbalancergb",
      iopOrder: 18,
      multiPriority: 1,
      multiName: "mask",
      previousBlendMode: "normal",
      requestedBlendMode: "multiply",
      currentBlendMode: "multiply",
      previousReverseOrder: false,
      requestedReverseOrder: true,
      currentReverseOrder: true,
      historyBefore: 3,
      historyAfter: 4,
      requestedHistoryEnd: 4
    });
  });
});

class StubProcessRunner {
  public readonly commands: Array<ReadonlyArray<string>> = [];

  public constructor(private readonly responses: ReadonlyArray<DarktableCliProcessResult>) {}

  public run(command: ReadonlyArray<string>): Promise<DarktableCliProcessResult> {
    this.commands.push([...command]);
    const response = this.responses[this.commands.length - 1];

    if (response === undefined) {
      throw new Error("No configured process response.");
    }

    return Promise.resolve(response);
  }
}

function createSnapshot(opacity: number): {
  readonly appliedHistoryEnd: 1;
  readonly controls: readonly [
    {
      readonly id: "exposure.exposure";
      readonly module: "exposure";
      readonly control: "exposure";
      readonly operations: readonly ["get", "set"];
      readonly requires: { readonly activeImage: true; readonly view: "darkroom" };
      readonly valueType: { readonly type: "number"; readonly minimum: -3; readonly maximum: 4 };
      readonly value: 0.25;
    }
  ];
  readonly moduleStack: readonly [
    {
      readonly instanceKey: "exposure#0#0#";
      readonly moduleOp: "exposure";
      readonly enabled: true;
      readonly iopOrder: 12;
      readonly multiPriority: 0;
      readonly multiName: "0";
      readonly blend: {
        readonly supported: true;
        readonly masksSupported: true;
        readonly opacity: number;
        readonly blendMode: "normal";
        readonly reverseOrder: false;
      };
      readonly params: { readonly encoding: "unsupported" };
    }
  ];
  readonly historyItems: readonly [
    {
      readonly index: 0;
      readonly applied: true;
      readonly instanceKey: "exposure#0#0#";
      readonly moduleOp: "exposure";
      readonly enabled: true;
      readonly iopOrder: 12;
      readonly multiPriority: 0;
      readonly multiName: "0";
      readonly blend: {
        readonly supported: true;
        readonly masksSupported: true;
        readonly opacity: number;
        readonly blendMode: "normal";
        readonly reverseOrder: false;
      };
      readonly params: { readonly encoding: "unsupported" };
    }
  ];
} {
  return {
    appliedHistoryEnd: 1,
    controls: [
      {
        id: "exposure.exposure",
        module: "exposure",
        control: "exposure",
        operations: ["get", "set"],
        requires: { activeImage: true, view: "darkroom" },
        valueType: { type: "number", minimum: -3, maximum: 4 },
        value: 0.25
      }
    ],
    moduleStack: [
      {
        instanceKey: "exposure#0#0#",
        moduleOp: "exposure",
        enabled: true,
        iopOrder: 12,
        multiPriority: 0,
        multiName: "0",
        blend: {
          supported: true,
          masksSupported: true,
          opacity,
          blendMode: "normal",
          reverseOrder: false
        },
        params: { encoding: "unsupported" }
      }
    ],
    historyItems: [
      {
        index: 0,
        applied: true,
        instanceKey: "exposure#0#0#",
        moduleOp: "exposure",
        enabled: true,
        iopOrder: 12,
        multiPriority: 0,
        multiName: "0",
        blend: {
          supported: true,
          masksSupported: true,
          opacity,
          blendMode: "normal",
          reverseOrder: false
        },
        params: { encoding: "unsupported" }
      }
    ]
  };
}

function createNowMilliseconds(values: ReadonlyArray<number>): () => number {
  let index = 0;

  return (): number => {
    const value = values[index];

    if (value === undefined) {
      throw new Error("No configured timestamp.");
    }

    index += 1;
    return value;
  };
}
