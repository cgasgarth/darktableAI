import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge reorder", (): void => {
  test("passes anchor instance keys to apply-module-instance-action", async (): Promise<void> => {
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
          moduleAction: {
            targetInstanceKey: "colorbalancergb#0#1#mask",
            action: "move-before",
            anchorInstanceKey: "exposure#0#0#",
            moduleOp: "colorbalancergb",
            iopOrder: 8,
            multiPriority: 1,
            multiName: "mask",
            previousIopOrder: 14,
            currentIopOrder: 8,
            historyBefore: 4,
            historyAfter: 5,
            requestedHistoryEnd: 5
          },
          snapshot: {
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
                params: { encoding: "unsupported" }
              },
              {
                instanceKey: "colorbalancergb#0#1#mask",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 8,
                multiPriority: 1,
                multiName: "mask",
                params: { encoding: "unsupported" }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "colorbalancergb#0#1#mask",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 8,
                multiPriority: 1,
                multiName: "mask",
                params: { encoding: "unsupported" }
              }
            ]
          }
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

    const result = await bridge.applyModuleInstanceAction({
      instanceKey: "colorbalancergb#0#1#mask",
      action: "move-before",
      anchorInstanceKey: "exposure#0#0#"
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-action",
        "colorbalancergb#0#1#mask",
        "move-before",
        "exposure#0#0#"
      ]
    ]);
    expect(result.moduleAction).toEqual({
      targetInstanceKey: "colorbalancergb#0#1#mask",
      action: "move-before",
      anchorInstanceKey: "exposure#0#0#",
      moduleOp: "colorbalancergb",
      iopOrder: 8,
      multiPriority: 1,
      multiName: "mask",
      previousIopOrder: 14,
      currentIopOrder: 8,
      historyBefore: 4,
      historyAfter: 5,
      requestedHistoryEnd: 5
    });
    expect(result.diagnostics.commandArguments).toEqual([
      "/opt/darktable/build/bin/darktable-live-bridge",
      "apply-module-instance-action",
      "colorbalancergb#0#1#mask",
      "move-before",
      "exposure#0#0#"
    ]);
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
