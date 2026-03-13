import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge delete", (): void => {
  test("invokes apply-module-instance-action for delete payloads", async (): Promise<void> => {
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
            targetInstanceKey: "colorbalancergb#7#1#mask",
            action: "delete",
            moduleOp: "colorbalancergb",
            iopOrder: 8,
            multiPriority: 1,
            multiName: "mask",
            historyBefore: 6,
            historyAfter: 5,
            requestedHistoryEnd: 5,
            replacementInstanceKey: "colorbalancergb#8#2#replacement",
            replacementIopOrder: 9,
            replacementMultiPriority: 2,
            replacementMultiName: "replacement"
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
                instanceKey: "colorbalancergb#8#2#replacement",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 9,
                multiPriority: 2,
                multiName: "replacement",
                params: { encoding: "unsupported" }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "colorbalancergb#8#2#replacement",
                moduleOp: "colorbalancergb",
                enabled: true,
                iopOrder: 9,
                multiPriority: 2,
                multiName: "replacement",
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
      instanceKey: "colorbalancergb#7#1#mask",
      action: "delete"
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-action",
        "colorbalancergb#7#1#mask",
        "delete"
      ]
    ]);
    expect(result.moduleAction).toEqual({
      targetInstanceKey: "colorbalancergb#7#1#mask",
      action: "delete",
      moduleOp: "colorbalancergb",
      iopOrder: 8,
      multiPriority: 1,
      multiName: "mask",
      historyBefore: 6,
      historyAfter: 5,
      requestedHistoryEnd: 5,
      replacementInstanceKey: "colorbalancergb#8#2#replacement",
      replacementIopOrder: 9,
      replacementMultiPriority: 2,
      replacementMultiName: "replacement"
    });
    expect(result.diagnostics.commandArguments).toEqual([
      "/opt/darktable/build/bin/darktable-live-bridge",
      "apply-module-instance-action",
      "colorbalancergb#7#1#mask",
      "delete"
    ]);
  });
});

class StubProcessRunner {
  public readonly commands: Array<ReadonlyArray<string>> = [];

  public constructor(private readonly responses: ReadonlyArray<DarktableCliProcessResult>) {}

  public run(command: ReadonlyArray<string>): Promise<DarktableCliProcessResult> {
    this.commands.push([...command]);
    const response = this.responses[this.commands.length - 1];
    if (response === undefined) throw new Error("No configured process response.");
    return Promise.resolve(response);
  }
}

function createNowMilliseconds(values: ReadonlyArray<number>): () => number {
  let index = 0;
  return (): number => {
    const value = values[index];
    if (value === undefined) throw new Error("No configured timestamp.");
    index += 1;
    return value;
  };
}
