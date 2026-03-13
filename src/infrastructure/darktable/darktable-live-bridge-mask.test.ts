import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge mask", (): void => {
  test("invokes apply-module-instance-mask for clear-mask", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify(createSuccessPayload("clear-mask")),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      { binaryPath: "/opt/darktable/build/bin/darktable-live-bridge" },
      processRunner,
      undefined,
      () => 1000
    );

    const result = await bridge.applyModuleInstanceMask({
      instanceKey: "colorbalancergb#7#1#",
      action: "clear-mask"
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-mask",
        "colorbalancergb#7#1#",
        '{"action":"clear-mask"}'
      ]
    ]);
    expect(result.status).toBe("ok");
  });

  test("serializes sourceInstanceKey for reuse-same-shapes", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify(createSuccessPayload("reuse-same-shapes")),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      { binaryPath: "/opt/darktable/build/bin/darktable-live-bridge" },
      processRunner,
      undefined,
      () => 1000
    );

    await bridge.applyModuleInstanceMask({
      instanceKey: "colorbalancergb#7#1#",
      action: "reuse-same-shapes",
      sourceInstanceKey: "exposure#0#0#"
    });

    expect(processRunner.commands[0]).toEqual([
      "/opt/darktable/build/bin/darktable-live-bridge",
      "apply-module-instance-mask",
      "colorbalancergb#7#1#",
      '{"action":"reuse-same-shapes","sourceInstanceKey":"exposure#0#0#"}'
    ]);
  });
});

class StubProcessRunner {
  public readonly commands: Array<ReadonlyArray<string>> = [];

  public constructor(private readonly results: ReadonlyArray<DarktableCliProcessResult>) {}

  public run(commandArguments: ReadonlyArray<string>): Promise<DarktableCliProcessResult> {
    this.commands.push([...commandArguments]);
    const result = this.results[this.commands.length - 1];
    if (result === undefined) {
      throw new Error("Unexpected process invocation.");
    }

    return Promise.resolve(result);
  }
}

function createSuccessPayload(action: "clear-mask" | "reuse-same-shapes"): Record<string, unknown> {
  return {
    bridgeVersion: 1,
    status: "ok",
    session: { view: "darkroom", renderSequence: 1, historyChangeSequence: 1, imageLoadSequence: 1 },
    activeImage: {
      imageId: 7,
      directoryPath: "/photos",
      fileName: "frame.ARW",
      sourceAssetPath: "/photos/frame.ARW"
    },
    moduleMask: {
      targetInstanceKey: "colorbalancergb#7#1#",
      action,
      ...(action === "reuse-same-shapes" ? { sourceInstanceKey: "exposure#0#0#" } : {}),
      moduleOp: "colorbalancergb",
      iopOrder: 18,
      multiPriority: 1,
      multiName: "mask",
      previousHasMask: true,
      currentHasMask: action === "reuse-same-shapes",
      changed: true,
      previousForms: [{ formId: 11, state: 1, opacity: 1 }],
      sourceForms: action === "reuse-same-shapes" ? [{ formId: 22, state: 1, opacity: 1 }] : [],
      currentForms: action === "reuse-same-shapes" ? [{ formId: 22, state: 1, opacity: 1 }] : [],
      historyBefore: 2,
      historyAfter: 3,
      requestedHistoryEnd: 3
    },
    snapshot: {
      appliedHistoryEnd: 1,
      controls: [
        {
          id: "exposure.exposure",
          module: "exposure",
          control: "exposure",
          operations: ["get", "set"],
          requires: { view: "darkroom", activeImage: true },
          valueType: { type: "number", minimum: -3, maximum: 4 },
          value: 0.5
        }
      ],
      moduleStack: [
        {
          instanceKey: "exposure#0#0#",
          moduleOp: "exposure",
          enabled: true,
          iopOrder: 12,
          multiPriority: 0,
          multiName: "",
          params: { encoding: "unsupported" },
          blend: {
            supported: true,
            masksSupported: true,
            opacity: 100,
            blendMode: "normal",
            reverseOrder: false,
            blendColorspace: "rgb-scene"
          }
        },
        {
          instanceKey: "colorbalancergb#7#1#",
          moduleOp: "colorbalancergb",
          enabled: true,
          iopOrder: 18,
          multiPriority: 1,
          multiName: "mask",
          params: { encoding: "unsupported" },
          blend: {
            supported: true,
            masksSupported: true,
            opacity: 75,
            blendMode: "normal",
            reverseOrder: false,
            blendColorspace: "rgb-scene"
          }
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
            multiName: "",
            params: { encoding: "unsupported" },
            blend: {
              supported: true,
              masksSupported: true,
              opacity: 100,
              blendMode: "normal",
              reverseOrder: false,
              blendColorspace: "rgb-scene"
            }
          },
          {
            index: 1,
            applied: true,
            instanceKey: "colorbalancergb#7#1#",
          moduleOp: "colorbalancergb",
          enabled: true,
          iopOrder: 18,
          multiPriority: 1,
          multiName: "mask",
          params: { encoding: "unsupported" },
          blend: {
            supported: true,
            masksSupported: true,
            opacity: 75,
            blendMode: "normal",
            reverseOrder: false,
            blendColorspace: "rgb-scene"
          }
        }
      ]
    }
  } as const;
}
