import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge create", (): void => {
  test("invokes apply-module-instance-action for create payloads", async (): Promise<void> => {
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
            targetInstanceKey: "exposure#0#0#",
            action: "create",
            resultInstanceKey: "exposure#0#1#1",
            moduleOp: "exposure",
            iopOrder: 12,
            multiPriority: 1,
            multiName: "1",
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
                requires: { activeImage: true, view: "darkroom" },
                valueType: { type: "number", minimum: -3, maximum: 4 },
                value: 0.25
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure#0#1#1",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 1,
                multiName: "1",
                params: { encoding: "unsupported" }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "exposure#0#1#1",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 1,
                multiName: "1",
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
      instanceKey: "exposure#0#0#",
      action: "create"
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-action",
        "exposure#0#0#",
        "create"
      ]
    ]);
    expect(result.moduleAction).toEqual({
      targetInstanceKey: "exposure#0#0#",
      action: "create",
      resultInstanceKey: "exposure#0#1#1",
      moduleOp: "exposure",
      iopOrder: 12,
      multiPriority: 1,
      multiName: "1",
      historyBefore: 2,
      historyAfter: 3,
      requestedHistoryEnd: 3
    });
    if (result.status !== "ok") {
      throw new Error("Expected ok module action response.");
    }
    expect(result.snapshot.moduleStack[0]?.instanceKey).toBe("exposure#0#1#1");
    expect(result.diagnostics.commandArguments).toEqual([
      "/opt/darktable/build/bin/darktable-live-bridge",
      "apply-module-instance-action",
      "exposure#0#0#",
      "create"
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
