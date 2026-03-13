import { describe, expect, test } from "bun:test";

import { RunLiveModuleInstanceActionCommand } from "./run-live-module-instance-action-command";

describe("RunLiveModuleInstanceActionCommand create", (): void => {
  test("returns create module-action results with helper snapshot readback", async (): Promise<void> => {
    const command = new RunLiveModuleInstanceActionCommand({
      execute: () =>
        Promise.resolve({
          mutation: {
            bridgeVersion: 1,
            status: "ok" as const,
            session: {
              view: "darkroom",
              renderSequence: 9,
              historyChangeSequence: 4,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "exposure#0#0#",
              action: "create" as const,
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
              appliedHistoryEnd: 3,
              controls: [],
              moduleStack: [
                {
                  instanceKey: "exposure#0#1#1",
                  moduleOp: "exposure",
                  enabled: true,
                  iopOrder: 12,
                  multiPriority: 1,
                  multiName: "1",
                  params: {
                    encoding: "unsupported" as const
                  }
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
                  params: {
                    encoding: "unsupported" as const
                  }
                }
              ]
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "create"],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          },
          latestSnapshot: {
            bridgeVersion: 1,
            status: "ok" as const,
            session: {
              view: "darkroom",
              renderSequence: 9,
              historyChangeSequence: 4,
              imageLoadSequence: 1
            },
            activeImage: {
              imageId: 7,
              directoryPath: "/photos",
              fileName: "frame.ARW",
              sourceAssetPath: "/photos/frame.ARW"
            },
            moduleAction: {
              targetInstanceKey: "exposure#0#0#",
              action: "create" as const,
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
              appliedHistoryEnd: 3,
              controls: [],
              moduleStack: [
                {
                  instanceKey: "exposure#0#1#1",
                  moduleOp: "exposure",
                  enabled: true,
                  iopOrder: 12,
                  multiPriority: 1,
                  multiName: "1",
                  params: {
                    encoding: "unsupported" as const
                  }
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
                  params: {
                    encoding: "unsupported" as const
                  }
                }
              ]
            },
            diagnostics: {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "create"],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          },
          helperCallDiagnostics: [
            {
              helperBinaryPath: "/helper",
              commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "create"],
              exitCode: 0,
              elapsedMilliseconds: 7
            }
          ]
        })
    });

    const result = await command.execute({
      requestId: "request-5",
      instanceKey: "exposure#0#0#",
      action: "create"
    });

    expect(result).toEqual({
      ok: true,
      output: {
        requestId: "request-5",
        bridgeVersion: 1,
        status: "ok",
        diagnostics: [
          {
            helperBinaryPath: "/helper",
            commandArguments: ["/helper", "apply-module-instance-action", "exposure#0#0#", "create"],
            exitCode: 0,
            elapsedMilliseconds: 7
          }
        ],
        session: {
          view: "darkroom",
          renderSequence: 9,
          historyChangeSequence: 4,
          imageLoadSequence: 1
        },
        activeImage: {
          imageId: 7,
          directoryPath: "/photos",
          fileName: "frame.ARW",
          sourceAssetPath: "/photos/frame.ARW"
        },
        snapshot: {
          appliedHistoryEnd: 3,
          controls: [],
          moduleStack: [
            {
              instanceKey: "exposure#0#1#1",
              moduleOp: "exposure",
              enabled: true,
              iopOrder: 12,
              multiPriority: 1,
              multiName: "1",
              params: {
                encoding: "unsupported"
              }
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
              params: {
                encoding: "unsupported"
              }
            }
          ]
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
        }
      }
    });
  });
});
