import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge", (): void => {
  test("invokes get-session and attaches process diagnostics", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 21,
            historyChangeSequence: 8,
            imageLoadSequence: 2
          },
          exposure: {
            current: -0.2
          }
        }),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      processRunner,
      undefined,
      createNowMilliseconds([1000, 1017])
    );

    const result = await bridge.getSession();

    expect(processRunner.commands).toEqual([
      ["/opt/darktable/build/bin/darktable-live-bridge", "get-session"]
    ]);
    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      session: {
        view: "darkroom",
        renderSequence: 21,
        historyChangeSequence: 8,
        imageLoadSequence: 2
      },
      exposure: {
        current: -0.2
      },
      diagnostics: {
        helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
        commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "get-session"],
        exitCode: 0,
        elapsedMilliseconds: 17
      }
    });
  });

  test("surfaces transport failures as integration errors", async (): Promise<void> => {
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      new StubProcessRunner([
        {
          exitCode: 7,
          stdout: "",
          stderr: "socket closed"
        }
      ]),
      undefined,
      createNowMilliseconds([2000, 2003])
    );

    try {
      await bridge.getSession();
      throw new Error("Expected bridge transport failure.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "darktable-live-bridge failed (code=7; command=/opt/darktable/build/bin/darktable-live-bridge get-session): socket closed"
      );
    }
  });

  test("rejects malformed successful payloads", async (): Promise<void> => {
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      new StubProcessRunner([
        {
          exitCode: 0,
          stdout: JSON.stringify({
            bridgeVersion: 1,
            status: "ok",
            session: {
              view: "darkroom",
              renderSequence: 21,
              historyChangeSequence: 8,
              imageLoadSequence: "bad"
            }
          }),
          stderr: ""
        }
      ]),
      undefined,
      createNowMilliseconds([3000, 3001])
    );

    try {
      await bridge.getSession();
      throw new Error("Expected malformed payload failure.");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "darktable-live-bridge field 'session.imageLoadSequence' must be a finite number."
      );
    }
  });

  test("invokes apply-module-instance-action and parses module-action payloads", async (): Promise<void> => {
    const processRunner = new StubProcessRunner([
      {
        exitCode: 0,
        stdout: JSON.stringify({
          bridgeVersion: 1,
          status: "ok",
          session: {
            view: "darkroom",
            renderSequence: 22,
            historyChangeSequence: 9,
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
            requestedEnabled: false,
            moduleOp: "exposure",
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            action: "disable",
            previousEnabled: true,
            currentEnabled: false,
            changed: true,
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
                instanceKey: "exposure#0#0#",
                moduleOp: "exposure",
                enabled: false,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: { encoding: "unsupported" }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "exposure#0#0#",
                moduleOp: "exposure",
                enabled: false,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: { encoding: "unsupported" }
              }
            ]
          }
        }),
        stderr: ""
      }
    ]);
    const bridge = new DarktableLiveBridge(
      {
        binaryPath: "/opt/darktable/build/bin/darktable-live-bridge"
      },
      processRunner,
      undefined,
      createNowMilliseconds([4000, 4013])
    );

    const result = await bridge.applyModuleInstanceAction({
      instanceKey: "exposure#0#0#",
      action: "disable"
    });

    expect(processRunner.commands).toEqual([
      [
        "/opt/darktable/build/bin/darktable-live-bridge",
        "apply-module-instance-action",
        "exposure#0#0#",
        "disable"
      ]
    ]);
    expect(result).toEqual({
      bridgeVersion: 1,
      status: "ok",
      session: {
        view: "darkroom",
        renderSequence: 22,
        historyChangeSequence: 9,
        imageLoadSequence: 2
      },
      activeImage: {
        imageId: 7,
        directoryPath: "/photos",
        fileName: "frame.ARW",
        sourceAssetPath: "/photos/frame.ARW"
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
            enabled: false,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: { encoding: "unsupported" }
          }
        ],
        historyItems: [
          {
            index: 0,
            applied: true,
            instanceKey: "exposure#0#0#",
            moduleOp: "exposure",
            enabled: false,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: { encoding: "unsupported" }
          }
        ]
      },
      moduleAction: {
        targetInstanceKey: "exposure#0#0#",
        requestedEnabled: false,
        moduleOp: "exposure",
        iopOrder: 12,
        multiPriority: 0,
        multiName: "0",
        action: "disable",
        previousEnabled: true,
        currentEnabled: false,
        changed: true,
        historyBefore: 2,
        historyAfter: 3,
        requestedHistoryEnd: 3
      },
      diagnostics: {
        helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
        commandArguments: [
          "/opt/darktable/build/bin/darktable-live-bridge",
          "apply-module-instance-action",
          "exposure#0#0#",
          "disable"
        ],
        exitCode: 0,
        elapsedMilliseconds: 13
      }
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
