import { describe, expect, test } from "bun:test";

import { DarktableLiveBridge } from "./darktable-live-bridge";
import type { DarktableCliProcessResult } from "./darktable-cli-process-runner";

describe("DarktableLiveBridge snapshot flow", (): void => {
  test("invokes get-snapshot and parses snapshot payloads", async (): Promise<void> => {
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
          snapshot: {
            appliedHistoryEnd: 5,
            controls: [
              {
                id: "exposure.exposure",
                module: "exposure",
                control: "exposure",
                operations: ["get", "set"],
                requires: {
                  activeImage: true,
                  view: "darkroom"
                },
                valueType: {
                  type: "number",
                  minimum: -3,
                  maximum: 4
                },
                value: 0.3
              }
            ],
            moduleStack: [
              {
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              }
            ],
            historyItems: [
              {
                index: 0,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              },
              {
                index: 1,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              },
              {
                index: 2,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              },
              {
                index: 3,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
              },
              {
                index: 4,
                applied: true,
                instanceKey: "exposure:0",
                moduleOp: "exposure",
                enabled: true,
                iopOrder: 12,
                multiPriority: 0,
                multiName: "0",
                params: {
                  encoding: "unsupported"
                }
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
      createNowMilliseconds([1500, 1511])
    );

    const result = await bridge.getSnapshot();

    expect(processRunner.commands).toEqual([
      ["/opt/darktable/build/bin/darktable-live-bridge", "get-snapshot"]
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
        appliedHistoryEnd: 5,
        controls: [
          {
            id: "exposure.exposure",
            module: "exposure",
            control: "exposure",
            operations: ["get", "set"],
            requires: {
              activeImage: true,
              view: "darkroom"
            },
            valueType: {
              type: "number",
              minimum: -3,
              maximum: 4
            },
            value: 0.3
          }
        ],
        moduleStack: [
          {
            instanceKey: "exposure:0",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          }
        ],
        historyItems: [
          {
            index: 0,
            applied: true,
            instanceKey: "exposure:0",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          },
          {
            index: 1,
            applied: true,
            instanceKey: "exposure:0",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          },
          {
            index: 2,
            applied: true,
            instanceKey: "exposure:0",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          },
          {
            index: 3,
            applied: true,
            instanceKey: "exposure:0",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          },
          {
            index: 4,
            applied: true,
            instanceKey: "exposure:0",
            moduleOp: "exposure",
            enabled: true,
            iopOrder: 12,
            multiPriority: 0,
            multiName: "0",
            params: {
              encoding: "unsupported"
            }
          }
        ]
      },
      diagnostics: {
        helperBinaryPath: "/opt/darktable/build/bin/darktable-live-bridge",
        commandArguments: ["/opt/darktable/build/bin/darktable-live-bridge", "get-snapshot"],
        exitCode: 0,
        elapsedMilliseconds: 11
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
